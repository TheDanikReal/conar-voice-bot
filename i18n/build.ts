import * as fs from "node:fs"
import * as path from "node:path"

// ============================================================================
// Types & Interfaces
// ============================================================================

export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other"
export type PluralObject = Partial<Record<PluralCategory, string>>
export type TranslationValue = string | PluralObject | TranslationDictionary
export type TranslationDictionary = { [key: string]: TranslationValue }

export interface ParsedParam {
    name: string
    type: string
}

const PLURAL_KEYS = new Set(["zero", "one", "two", "few", "many", "other"])

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Replace - with _ in locale names to ensure that they would not cause
 * type errors
 */
function safeName(locale: string): string {
    return locale.replaceAll("-", "_")
}

/**
 * converts locale back to its original name, reverting safeName actions
 */
function unsafeName(locale: string): string {
    return locale.replaceAll("_", "-")
}

/**
 * Strict type guard to verify if an object is a valid plural configuration.
 */
function isPluralObject(value: unknown): value is PluralObject {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false
    }

    const keys = Object.keys(value)

    // Object must have at least one key, and ALL keys must be valid plural categories
    return keys.length > 0 && keys.every((key) => PLURAL_KEYS.has(key))
}

/**
 * Parses a translation string, escapes syntax characters, and extracts variables.
 * Transforms "{param}" into "${p.param}" for JavaScript template literals.
 */
function extractParamsAndTemplate(text: string) {
    // 1. Escape backticks and existing template literal expressions to prevent syntax errors
    const safeText = text.replace(/`/g, "\\`").replace(/\$\{/g, "\\${")

    const matches = [...safeText.matchAll(/\{(\w+)(?::(\w+))?\}/g)]
    const paramMap = new Map<string, string>()

    // extract parameters and infer their types
    for (const match of matches) {
        const paramName = match[1]!
        const explicitType = match[2]

        if (!paramMap.has(paramName)) {
            // infer type based on common names if no explicit type is provided
            const isNumberParam = ["count", "amount", "days", "num", "total"].includes(paramName)
            const resolvedType = explicitType ?? (isNumberParam ? "number" : "string")

            paramMap.set(paramName, resolvedType)
        }
    }

    // 3. Replace {param:type} with ${p.param}
    const template = safeText.replace(/\{(\w+)(?::\w+)?\}/g, "${p.$1}")

    return {
        params: Array.from(paramMap.entries()).map(([name, type]) => ({ name, type })),
        template
    }
}

// ============================================================================
// Code Generators
// ============================================================================

/**
 * Builds a TypeScript method for a plural translation object.
 */
function buildPluralMethod(locale: string, key: string, pluralObj: PluralObject): string {
    const allParams = new Map<string, string>()

    // 'count' is mandatory for pluralization logic
    allParams.set("count", "number")

    const branches = Object.entries(pluralObj).map(([pluralRule, text]) => {
        const { params, template } = extractParamsAndTemplate(text)

        // Collect all unique parameters across all plural branches
        for (const { name, type } of params) {
            allParams.set(name, type)
        }

        return `    ${pluralRule}: \`${template}\``
    })

    const typeSignature = Array.from(allParams.entries())
        .map(([name, type]) => `${name}: ${type}`)
        .join("; ")

    return `  ${key}: (p: { ${typeSignature} }) => plural('${locale}', p.count, {\n${branches.join(",\n")}\n  })`
}

/**
 * Builds a TypeScript method for a standard string translation.
 */
function buildStringMethod(key: string, text: string): string {
    const { params, template } = extractParamsAndTemplate(text)

    if (params.length === 0) {
        // No parameters needed, safely return the raw string
        return `  ${key}: () => ${JSON.stringify(text)}`
    }

    const typeSignature = params.map((p) => `${p.name}: ${p.type}`).join("; ")
    return `  ${key}: (p: { ${typeSignature} }) => \`${template}\``
}

/**
 * Iterates over the dictionary and generates the corresponding TypeScript methods.
 */
function generateDictionaryCode(locale: string, dict: TranslationDictionary, depth = 1): string {
    const methods: string[] = []
    const indent = "  ".repeat(depth)

    for (const [key, value] of Object.entries(dict)) {
        // Skip metadata or comment keys
        if (key.startsWith("@")) continue

        if (isPluralObject(value)) {
            methods.push(`${indent}${buildPluralMethod(locale, key, value).trimStart()}`)
        } else if (typeof value === "string") {
            methods.push(`${indent}${buildStringMethod(key, value).trimStart()}`)
        } else if (typeof value === "object" && value !== null) {
            // Generate code for nested translation keys
            methods.push(`${indent}${key}: {\n${generateDictionaryCode(locale, value as TranslationDictionary, depth + 1)}\n${indent}}`)
        }
    }

    return methods.join(",\n")
}

// ============================================================================
// Main Compiler
// ============================================================================

export function compileI18n(
    localesDir = "./i18n/locales",
    outputFile = "./src/generated/i18n.ts",
    baseLocale = "en"
): void {
    const resolvedLocalesDir = path.resolve(localesDir)
    const resolvedOutputFile = path.resolve(outputFile)

    if (!fs.existsSync(resolvedLocalesDir)) {
        throw new Error(`Locale directory not found: ${resolvedLocalesDir}`)
    }

    // 1. Discover and read all JSON dictionaries
    const files = fs.readdirSync(resolvedLocalesDir).filter((file) => file.endsWith(".json"))
    const locales = files.map((file) => path.basename(file, ".json"))
    /** locales with special symbols replaced to represent correct ts variable */
    const safeLocales = locales.map((locale) => safeName(locale))

    if (!locales.includes(baseLocale)) {
        throw new Error(`Base locale "${baseLocale}.json" does not exist in ${localesDir}`)
    }

    const dictionaries: Record<string, TranslationDictionary> = {}
    for (const locale of locales) {
        const filePath = path.join(resolvedLocalesDir, `${locale}.json`)
        const content = fs.readFileSync(filePath, "utf-8")
        dictionaries[safeName(locale)] = JSON.parse(content) as TranslationDictionary
    }

    // 2. Prepare code sections
    const pluralRulesCode = safeLocales.map((locale) => `  ${locale}: new Intl.PluralRules('${unsafeName(locale)}')`).join(",\n")

    const baseDictCode = `export const ${baseLocale} = {\n${generateDictionaryCode(
        baseLocale,
        dictionaries[baseLocale]!
    )}\n} as const;\n\nexport type Dict = typeof ${baseLocale};`

    const otherLocalesCode = safeLocales
        .filter((l) => l !== baseLocale)
        .map((locale) => {
            return `export const ${locale}: Dict = {\n  ...${baseLocale},\n${generateDictionaryCode(
                locale,
                dictionaries[locale]!
            )}\n};`
        })
        .join("\n\n")

    const dictMapCode = safeLocales.map((l) => `  ${l}`).join(",\n")

    // 3. Assemble the final TypeScript file
    const generatedCode = `// THIS FILE WAS GENERATED BY i18n/build.ts. DO NOT EDIT MANUALLY.


const prs: Record<string, Intl.PluralRules> = {
${pluralRulesCode}
};


// @ts-ignore: can be unused, suppressing unused function error
function plural(lang: string, count: number, forms: Partial<Record<Intl.LDMLPluralRule, string>>): string {
  const rule = prs[lang]?.select(count) ?? 'other';
  return forms[rule] ?? forms.other ?? '';
}


${baseDictCode}


${otherLocalesCode}


export const dictionaries = {
${dictMapCode}
} as const;


export type SupportedLocale = keyof typeof dictionaries;


export function getT(locale?: string): Dict {
  if (locale && locale in dictionaries) {
    return dictionaries[locale as SupportedLocale];
  }
  return dictionaries.${baseLocale};
}
`

    // 4. Write output to disk
    fs.mkdirSync(path.dirname(resolvedOutputFile), { recursive: true })
    fs.writeFileSync(resolvedOutputFile, generatedCode, "utf-8")

    console.log(`Locales successfully compiled to: ${outputFile}`)
    console.log(`Found locales: ${locales.join(", ")} (Base: ${baseLocale})`)
}

// Execute compiler
compileI18n()
