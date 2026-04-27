"use client"

import type { KeyboardEvent as ReactKeyboardEvent } from "react"

function getSelectedLineRange(
  value: string,
  selectionStart: number,
  selectionEnd: number
) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1
  const selectionAnchor =
    selectionEnd > selectionStart ? selectionEnd - 1 : selectionEnd
  const rawLineEnd = value.indexOf("\n", selectionAnchor)
  const lineEnd = rawLineEnd === -1 ? value.length : rawLineEnd
  const blockEnd =
    rawLineEnd === -1 || rawLineEnd === value.length ? lineEnd : lineEnd + 1

  return {
    blockEnd,
    lineEnd,
    lineStart,
  }
}

function updateTextareaValue(
  textarea: HTMLTextAreaElement,
  nextValue: string,
  selectionStart: number,
  selectionEnd: number
) {
  textarea.value = nextValue
  textarea.setSelectionRange(selectionStart, selectionEnd)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}

function duplicateSelectedLines(
  textarea: HTMLTextAreaElement,
  direction: "up" | "down"
) {
  const { selectionStart, selectionEnd, value } = textarea
  const { blockEnd, lineStart } = getSelectedLineRange(
    value,
    selectionStart,
    selectionEnd
  )
  const block = value.slice(lineStart, blockEnd)

  if (!block) return false

  if (direction === "up") {
    const nextValue = value.slice(0, lineStart) + block + value.slice(lineStart)
    updateTextareaValue(textarea, nextValue, lineStart, lineStart + block.length)
    return true
  }

  const nextValue = value.slice(0, blockEnd) + block + value.slice(blockEnd)
  updateTextareaValue(textarea, nextValue, blockEnd, blockEnd + block.length)
  return true
}

function moveSelectedLines(
  textarea: HTMLTextAreaElement,
  direction: "up" | "down"
) {
  const { selectionStart, selectionEnd, value } = textarea
  const { blockEnd, lineStart } = getSelectedLineRange(
    value,
    selectionStart,
    selectionEnd
  )
  const block = value.slice(lineStart, blockEnd)

  if (!block) return false

  if (direction === "up") {
    if (lineStart === 0) return false

    const previousLineStart = value.lastIndexOf("\n", Math.max(0, lineStart - 2)) + 1
    const previousBlock = value.slice(previousLineStart, lineStart)
    const nextValue =
      value.slice(0, previousLineStart) +
      block +
      previousBlock +
      value.slice(blockEnd)

    updateTextareaValue(
      textarea,
      nextValue,
      previousLineStart,
      previousLineStart + block.length
    )
    return true
  }

  if (blockEnd >= value.length) return false

  const nextLineEndIndex = value.indexOf("\n", blockEnd)
  const nextBlockEnd =
    nextLineEndIndex === -1 ? value.length : nextLineEndIndex + 1
  const nextBlock = value.slice(blockEnd, nextBlockEnd)
  const nextValue =
    value.slice(0, lineStart) + nextBlock + block + value.slice(nextBlockEnd)

  updateTextareaValue(
    textarea,
    nextValue,
    lineStart + nextBlock.length,
    lineStart + nextBlock.length + block.length
  )
  return true
}

function deleteSelectedLines(textarea: HTMLTextAreaElement) {
  const { selectionStart, selectionEnd, value } = textarea

  if (!value) return false

  const { blockEnd, lineEnd, lineStart } = getSelectedLineRange(
    value,
    selectionStart,
    selectionEnd
  )
  const deleteStart =
    lineStart === 0 ? lineStart : lineEnd === value.length ? lineStart - 1 : lineStart
  const deleteEnd = lineEnd === value.length ? lineEnd : blockEnd
  const nextValue = value.slice(0, deleteStart) + value.slice(deleteEnd)

  updateTextareaValue(textarea, nextValue, deleteStart, deleteStart)
  return true
}

function indentSelectedLines(
  textarea: HTMLTextAreaElement,
  direction: "in" | "out"
) {
  const { selectionStart, selectionEnd, value } = textarea
  const { lineEnd, lineStart } = getSelectedLineRange(
    value,
    selectionStart,
    selectionEnd
  )
  const block = value.slice(lineStart, lineEnd)
  const lines = block.split("\n")

  if (!lines.length) return false

  if (direction === "in") {
    const indentedBlock = lines.map((line) => `  ${line}`).join("\n")
    const nextValue =
      value.slice(0, lineStart) + indentedBlock + value.slice(lineEnd)
    const lineCount = lines.length
    const isSingleCursor = selectionStart === selectionEnd

    updateTextareaValue(
      textarea,
      nextValue,
      isSingleCursor ? selectionStart + 2 : selectionStart + 2,
      selectionEnd + lineCount * 2
    )
    return true
  }

  let removedBeforeSelectionStart = 0
  let totalRemoved = 0
  const outdentedLines = lines.map((line, index) => {
    if (line.startsWith("  ")) {
      totalRemoved += 2
      if (index === 0) removedBeforeSelectionStart = 2
      return line.slice(2)
    }
    if (line.startsWith("\t")) {
      totalRemoved += 1
      if (index === 0) removedBeforeSelectionStart = 1
      return line.slice(1)
    }
    return line
  })

  if (totalRemoved === 0) return false

  const nextValue =
    value.slice(0, lineStart) + outdentedLines.join("\n") + value.slice(lineEnd)

  updateTextareaValue(
    textarea,
    nextValue,
    Math.max(lineStart, selectionStart - removedBeforeSelectionStart),
    Math.max(lineStart, selectionEnd - totalRemoved)
  )
  return true
}

export function handleTextareaVsCodeKeydown(
  event: ReactKeyboardEvent<HTMLTextAreaElement>
) {
  const textarea = event.currentTarget

  if (event.altKey && event.shiftKey && event.key === "ArrowUp") {
    event.preventDefault()
    return duplicateSelectedLines(textarea, "up")
  }

  if (event.altKey && event.shiftKey && event.key === "ArrowDown") {
    event.preventDefault()
    return duplicateSelectedLines(textarea, "down")
  }

  if (event.altKey && !event.shiftKey && event.key === "ArrowUp") {
    event.preventDefault()
    return moveSelectedLines(textarea, "up")
  }

  if (event.altKey && !event.shiftKey && event.key === "ArrowDown") {
    event.preventDefault()
    return moveSelectedLines(textarea, "down")
  }

  if (!event.altKey && event.shiftKey && event.key === "Delete") {
    event.preventDefault()
    return deleteSelectedLines(textarea)
  }

  if (!event.altKey && !event.metaKey && !event.ctrlKey && event.key === "Tab") {
    event.preventDefault()
    return indentSelectedLines(textarea, event.shiftKey ? "out" : "in")
  }

  return false
}
