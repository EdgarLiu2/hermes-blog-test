import { describe, it, expect } from "vitest";
import { getTagFrequency, parseTagsParam, filterPostsByTags } from "@/lib/tags";
import type { Post } from "@/lib/types";

function makePost(slug: string, tags: string[]): Post {
  return {
    slug,
    meta: { title: slug, date: "2026-08-27", tags, author: "EdgarLiu2" },
    content: "",
  };
}

describe("lib/tags - 标签频率统计", () => {
  it("统计所有文章标签出现次数并按频率降序", () => {
    const posts = [
      makePost("a", ["AI", "Hermes"]),
      makePost("b", ["AI", "Beginner"]),
      makePost("c", ["Hermes"]),
    ];
    const freq = getTagFrequency(posts);
    expect(freq[0]).toEqual({ tag: "AI", count: 2 });
    expect(freq[1]).toEqual({ tag: "Hermes", count: 2 });
    // AI 与 Hermes 同频，按字母序 AI 在前
    expect(freq.map((f) => f.tag)).toEqual(["AI", "Hermes", "Beginner"]);
    expect(freq.map((f) => f.count)).toEqual([2, 2, 1]);
  });

  it("空文章列表返回空数组", () => {
    expect(getTagFrequency([])).toEqual([]);
  });

  it("标签去重（同一文章内重复标签只计一次）", () => {
    const posts = [makePost("a", ["AI", "AI"])];
    const freq = getTagFrequency(posts);
    expect(freq).toEqual([{ tag: "AI", count: 1 }]);
  });
});

describe("lib/tags - URL 参数解析", () => {
  it("解析逗号分隔的多选标签", () => {
    expect(parseTagsParam("AI,Python")).toEqual(["AI", "Python"]);
  });

  it("去掉空格并过滤空值", () => {
    expect(parseTagsParam(" AI , , Python ")).toEqual(["AI", "Python"]);
  });

  it("null 或空字符串返回空数组", () => {
    expect(parseTagsParam(null)).toEqual([]);
    expect(parseTagsParam("")).toEqual([]);
    expect(parseTagsParam("  ,  ")).toEqual([]);
  });

  it("重复标签去重", () => {
    expect(parseTagsParam("AI,AI,Hermes")).toEqual(["AI", "Hermes"]);
  });
});

describe("lib/tags - 按标签过滤", () => {
  it("OR 逻辑：文章含任一选中标签即保留", () => {
    const posts = [
      makePost("a", ["AI"]),
      makePost("b", ["Hermes"]),
      makePost("c", ["Beginner"]),
    ];
    const result = filterPostsByTags(posts, ["AI", "Hermes"]);
    expect(result.map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("无选中标签时返回全部文章", () => {
    const posts = [makePost("a", ["AI"]), makePost("b", ["Hermes"])];
    expect(filterPostsByTags(posts, [])).toHaveLength(2);
  });

  it("选中标签无匹配时返回空数组", () => {
    const posts = [makePost("a", ["AI"])];
    expect(filterPostsByTags(posts, ["Nonexistent"])).toEqual([]);
  });

  it("保持原始文章顺序（不因过滤打乱）", () => {
    const posts = [
      makePost("first", ["x"]),
      makePost("second", ["AI"]),
      makePost("third", ["x", "AI"]),
    ];
    const result = filterPostsByTags(posts, ["AI"]);
    expect(result.map((p) => p.slug)).toEqual(["second", "third"]);
  });
});
