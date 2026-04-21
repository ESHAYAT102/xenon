"use client"

import { FileTree, useFileTree } from "@pierre/trees/react"
import { usePathname, useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type MouseEvent,
} from "react"
import {
  Bun,
  Docker,
  Document,
  Eslint,
  Git,
  Image as ImageFile,
  Js,
  License,
  Markdown,
  Next,
  NPM,
  PNPM,
  Python,
  SVG,
  Shell,
  Tailwind,
  Text,
  Tsconfig,
  TypeScript,
  Vite,
  Yaml,
  Yarn,
} from "@react-symbols/icons/files"
import {
  Folder,
  FolderApp,
  FolderAssets,
  FolderConfig,
  FolderFonts,
  FolderHelpers,
  FolderHooks,
  FolderImages,
  FolderReact,
  FolderSrc,
  FolderUtils,
} from "@react-symbols/icons/folders"

import type {
  GitHubRepositoryContent,
  GitHubRepositoryTreeItem,
} from "@/lib/github"

type RepositoryFileTreeProps = {
  branch?: string
  commit?: string
  initialContents: GitHubRepositoryContent[]
  onFileSelect?: (path: string) => boolean
  owner: string
  repo: string
  selectedPath?: string
  treeItems?: GitHubRepositoryTreeItem[]
}

const prefetchedFileRoutes = new Set<string>()
const MAX_PREFETCHED_FILE_ROUTES = 250

function toTreeDirectoryPath(path: string) {
  return path.endsWith("/") ? path : `${path}/`
}

function toRepositoryPath(path: string) {
  return path.endsWith("/") ? path.slice(0, -1) : path
}

function getTreeRowFromEvent(event: MouseEvent<HTMLElement>) {
  return event
    .nativeEvent
    .composedPath()
    .find(
      (target): target is HTMLElement =>
        target instanceof HTMLElement &&
        target.getAttribute("data-type") === "item"
    )
}

export function getRepositoryItemIcon(
  item: Pick<GitHubRepositoryContent, "name" | "type">
) {
  const name = item.name.toLowerCase()

  if (item.type === "dir") {
    if (name === "app") {
      return <FolderApp className="size-4 text-muted-foreground" />
    }

    if (name === "src") {
      return <FolderSrc className="size-4 text-muted-foreground" />
    }

    if (name === "hooks") {
      return <FolderHooks className="size-4 text-muted-foreground" />
    }

    if (name === "components") {
      return <FolderReact className="size-4 text-muted-foreground" />
    }

    if (name === "lib") {
      return <FolderHelpers className="size-4 text-muted-foreground" />
    }

    if (name === "utils") {
      return <FolderUtils className="size-4 text-muted-foreground" />
    }

    if (name === "public") {
      return <FolderAssets className="size-4 text-muted-foreground" />
    }

    if (name === "assets") {
      return <FolderAssets className="size-4 text-muted-foreground" />
    }

    if (name === "images" || name === "img") {
      return <FolderImages className="size-4 text-muted-foreground" />
    }

    if (name === "fonts") {
      return <FolderFonts className="size-4 text-muted-foreground" />
    }

    if (name === "config" || name === "configs") {
      return <FolderConfig className="size-4 text-muted-foreground" />
    }

    return <Folder className="size-4 text-muted-foreground" />
  }

  if (
    name === "dockerfile" ||
    name === "docker-compose.yml" ||
    name === "docker-compose.yaml"
  ) {
    return <Docker className="size-4 text-muted-foreground" />
  }

  if (name === "package.json") {
    return <NPM className="size-4 text-muted-foreground" />
  }

  if (name === "pnpm-lock.yaml") {
    return <PNPM className="size-4 text-muted-foreground" />
  }

  if (name === "yarn.lock") {
    return <Yarn className="size-4 text-muted-foreground" />
  }

  if (name === "bun.lock" || name === "bun.lockb") {
    return <Bun className="size-4 text-muted-foreground" />
  }

  if (name === "package-lock.json") {
    return <NPM className="size-4 text-muted-foreground" />
  }

  if (name.startsWith("tsconfig")) {
    return <Tsconfig className="size-4 text-muted-foreground" />
  }

  if (name.startsWith("tailwind.config.")) {
    return <Tailwind className="size-4 text-muted-foreground" />
  }

  if (
    name === "eslint.config.js" ||
    name === "eslint.config.mjs" ||
    name === "eslint.config.cjs" ||
    name.startsWith(".eslintrc")
  ) {
    return <Eslint className="size-4 text-muted-foreground" />
  }

  if (name.startsWith("vite.config.")) {
    return <Vite className="size-4 text-muted-foreground" />
  }

  if (name.startsWith("next.config.")) {
    return <Next className="size-4 text-muted-foreground" />
  }

  if (name.startsWith(".git")) {
    return <Git className="size-4 text-muted-foreground" />
  }

  if (name === "license" || name.startsWith("license.")) {
    return <License className="size-4 text-muted-foreground" />
  }

  if (name.endsWith(".md") || name.endsWith(".mdx")) {
    return <Markdown className="size-4 text-muted-foreground" />
  }

  if (/\.(ts|tsx)$/.test(name)) {
    return <TypeScript className="size-4 text-muted-foreground" />
  }

  if (/\.(js|jsx|mjs|cjs)$/.test(name)) {
    return <Js className="size-4 text-muted-foreground" />
  }

  if (name.endsWith(".html") || name.endsWith(".htm")) {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (/\.(css|scss|sass|less)$/.test(name)) {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (/\.(json|jsonc)$/.test(name)) {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (name === ".env" || name.startsWith(".env.") || name === ".envrc") {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (
    name === ".prettierrc" ||
    name.startsWith(".prettierrc.") ||
    name === "prettier.config.js" ||
    name === "prettier.config.mjs" ||
    name === "prettier.config.cjs"
  ) {
    return <Document className="size-4 text-muted-foreground" />
  }

  if (/\.(png|jpe?g|gif|webp|avif|bmp|ico)$/.test(name)) {
    return <ImageFile className="size-4 text-muted-foreground" />
  }

  if (name.endsWith(".svg")) {
    return <SVG className="size-4 text-muted-foreground" />
  }

  if (/\.(yml|yaml)$/.test(name)) {
    return <Yaml className="size-4 text-muted-foreground" />
  }

  if (
    /\.(sh|bash|zsh|fish)$/.test(name) ||
    name === ".bashrc" ||
    name === ".zshrc"
  ) {
    return <Shell className="size-4 text-muted-foreground" />
  }

  if (name.endsWith(".py")) {
    return <Python className="size-4 text-muted-foreground" />
  }

  if (/\.(txt|ini|toml|xml)$/.test(name)) {
    return <Text className="size-4 text-muted-foreground" />
  }

  return <Document className="size-4 text-muted-foreground" />
}

function RepositoryFileTreeInner({
  branch,
  commit,
  initialContents,
  onFileSelect,
  owner,
  repo,
  selectedPath,
  treeItems = [],
}: RepositoryFileTreeProps) {
  const router = useRouter()
  const pathname = usePathname()
  const lastNavigationRef = useRef<string | null>(null)
  const filePaths = useMemo(
    () =>
      treeItems.length > 0
        ? treeItems.map((item) =>
            item.type === "tree" ? toTreeDirectoryPath(item.path) : item.path
          )
        : initialContents.map((item) =>
            item.type === "dir" ? toTreeDirectoryPath(item.path) : item.path
          ),
    [initialContents, treeItems]
  )
  const directoryPaths = useMemo(
    () =>
      new Set(
        treeItems.length > 0
          ? treeItems
              .filter((item) => item.type === "tree")
              .flatMap((item) => [item.path, toTreeDirectoryPath(item.path)])
          : initialContents
              .filter((item) => item.type === "dir")
              .flatMap((item) => [item.path, toTreeDirectoryPath(item.path)])
      ),
    [initialContents, treeItems]
  )
  const selectedPaths = selectedPath ? [selectedPath] : []
  const navigableFilePaths = useMemo(
    () =>
      treeItems.length > 0
        ? treeItems
            .filter((item) => item.type === "blob")
            .map((item) => item.path)
        : initialContents
            .filter((item) => item.type !== "dir")
            .map((item) => item.path),
    [initialContents, treeItems]
  )
  const buildFileUrl = useCallback(
    (path: string) => {
      const params = new URLSearchParams()
      if (branch) params.set("branch", branch)
      if (commit) params.set("commit", commit)
      params.set("path", path)

      return `${pathname}?${params.toString()}`
    },
    [branch, commit, pathname]
  )
  const navigateToFile = useCallback(
    (path: string) => {
      const repositoryPath = toRepositoryPath(path)
      if (directoryPaths.has(path) || directoryPaths.has(repositoryPath)) return
      const href = buildFileUrl(repositoryPath)
      if (lastNavigationRef.current === href) return

      const handledInstantly = onFileSelect?.(repositoryPath) ?? false
      lastNavigationRef.current = href

      if (handledInstantly) {
        window.history.pushState(null, "", href)
        return
      }

      router.push(href)
    },
    [buildFileUrl, directoryPaths, onFileSelect, router]
  )

  const handleTreeClick = (event: MouseEvent<HTMLElement>) => {
    const row = getTreeRowFromEvent(event)

    if (!row || row.getAttribute("data-item-type") !== "file") return

    const path = row.getAttribute("data-item-path")
    if (!path) return

    navigateToFile(path)
  }

  const handleTreeClickCapture = (event: MouseEvent<HTMLElement>) => {
    const row = getTreeRowFromEvent(event)

    if (!row || row.getAttribute("data-item-type") !== "folder") return

    const path = row.getAttribute("data-item-path")
    const item = path ? model.getItem(path) : null

    if (!item || !item.isDirectory()) return

    event.preventDefault()
    event.stopPropagation()
    ;(item as { toggle(): void }).toggle()
  }

  useEffect(() => {
    if (navigableFilePaths.length === 0) return

    const pendingRoutes = navigableFilePaths
      .filter((path) => path !== selectedPath)
      .slice(0, MAX_PREFETCHED_FILE_ROUTES)
      .map(buildFileUrl)
      .filter((route) => !prefetchedFileRoutes.has(route))

    if (pendingRoutes.length === 0) return

    let timer: number | null = null
    let index = 0

    const prefetchNext = () => {
      const route = pendingRoutes[index]
      if (!route) return

      if (!prefetchedFileRoutes.has(route)) {
        prefetchedFileRoutes.add(route)
        router.prefetch(route)
      }

      index += 1

      if (index < pendingRoutes.length) {
        timer = window.setTimeout(prefetchNext, 25)
      }
    }

    timer = window.setTimeout(prefetchNext, 0)

    return () => {
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [buildFileUrl, navigableFilePaths, router, selectedPath])

  const { model } = useFileTree({
    flattenEmptyDirectories: false,
    initialExpansion: "closed",
    initialSelectedPaths: selectedPaths,
    itemHeight: 32,
    paths: filePaths,
    search: filePaths.length > 8,
    stickyFolders: true,
    unsafeCSS: `
      :host {
        --trees-bg-override: transparent;
        --trees-fg-override: hsl(var(--foreground));
        --trees-muted-fg-override: hsl(var(--muted-foreground));
        --trees-selected-bg-override: hsl(var(--accent) / 0.35);
        --trees-hover-bg-override: hsl(var(--accent) / 0.2);
        --trees-border-color-override: hsl(var(--border));
      }
      button[data-type='item'] {
        font: inherit;
      }
    `,
  })

  return (
    <div className="py-4">
      <FileTree
        aria-label={`${owner}/${repo} files`}
        className="block min-h-80 w-full overflow-hidden"
        model={model}
        onClick={handleTreeClick}
        onClickCapture={handleTreeClickCapture}
        style={{ height: "min(70vh, 720px)" }}
      />
    </div>
  )
}

export default function RepositoryFileTree(props: RepositoryFileTreeProps) {
  const treeKey = [
    props.owner,
    props.repo,
    props.branch ?? "default",
    props.commit ?? "branch",
  ].join("/")
  return <RepositoryFileTreeInner key={treeKey} {...props} />
}
