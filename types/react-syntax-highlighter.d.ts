declare module "react-syntax-highlighter" {
  import type { ComponentType, CSSProperties, ReactNode } from "react"

  export type SyntaxHighlighterProps = {
    children?: ReactNode
    className?: string
    codeTagProps?: Record<string, unknown>
    customStyle?: CSSProperties
    language?: string
    lineNumberStyle?: CSSProperties
    showLineNumbers?: boolean
    style?: Record<string, unknown>
    wrapLongLines?: boolean
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const oneDark: Record<string, unknown>
}
