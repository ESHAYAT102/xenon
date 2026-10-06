import { afterEach, expect, it, vi } from "vitest"

import {
  getGitHubRepositoryReleases,
  getGitHubStarredRepositories,
} from "@/lib/github"

afterEach(() => vi.unstubAllGlobals())

it("loads starred repositories without fetching a language for each one", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify([
        { id: 1, language: null, languages_url: "https://api.github.com/repos/a/languages" },
      ]),
      { status: 200 }
    )
  )
  vi.stubGlobal("fetch", fetchMock)

  expect(await getGitHubStarredRepositories("octocat", null)).toHaveLength(1)
  expect(fetchMock).toHaveBeenCalledOnce()
})

it("loads only the latest release for the repository badge", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify([{ id: 1, tag_name: "v1" }]), { status: 200 })
  )
  vi.stubGlobal("fetch", fetchMock)

  expect(await getGitHubRepositoryReleases("fixture", "sample", null, 1)).toHaveLength(1)
  expect(fetchMock).toHaveBeenCalledOnce()
  expect(fetchMock.mock.calls[0][0]).toContain("per_page=1")
})
