import { COMMENT_MAX_LENGTH, normalizeCommentBody, validateCommentBody } from "./comments";

describe("comment validation", () => {
  it("trims and rejects empty bodies", () => {
    expect(normalizeCommentBody("  oi  ")).toBe("oi");
    const result = validateCommentBody("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Comentário não pode ser vazio.");
  });

  it("rejects bodies over the max length", () => {
    const over = "a".repeat(COMMENT_MAX_LENGTH + 1);
    const result = validateCommentBody(over);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(`Comentário deve ter no máximo ${COMMENT_MAX_LENGTH} caracteres.`);
  });

  it("accepts bodies at the max length", () => {
    const exact = "a".repeat(COMMENT_MAX_LENGTH);
    const result = validateCommentBody(exact);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe(exact);
  });
});
