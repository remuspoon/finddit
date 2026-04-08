import { RichTextBuilder } from "@devvit/public-api";
import type { FormatRange } from "@devvit/shared-types/richtext/types.js";
import { Block, CommentConfig, ValidLink } from "./types.js";

const DEFAULT_BLOCKS: Block[] = [
  { type: "text", text: "Hey there, thanks for sharing." },
  { type: "text", text: "While you wait for people to comment, have a look at these posts which might be relevant to you:" },
  { type: "links" },
  { type: "text", text: "Remember, even though it might feel like it, you are not alone. Stay strong!" },
  { type: "inline", parts: [
    { type: "text", text: "This is an automated message. If you have any feedback or issues, post in " },
    { type: "link", text: "r/finddit_app", url: "https://www.reddit.com/r/finddit_app/" },
    { type: "text", text: "." },
  ]},
];

export function buildCommentRichtext(validLinks: ValidLink[], config?: CommentConfig | null): RichTextBuilder {
  const blocks = config?.blocks ?? DEFAULT_BLOCKS;
  const builder = new RichTextBuilder();

  for (const block of blocks) {
    switch (block.type) {
      case "text": {
        const { text, bold, italic } = block;
        const bits = (bold ? 1 : 0) | (italic ? 2 : 0);
        const formatting: FormatRange[] | undefined =
          bits > 0 ? [[bits, 0, text.length] as FormatRange] : undefined;
        builder.paragraph((p) => {
          p.text({ text, ...(formatting ? { formatting } : {}) });
        });
        break;
      }
      case "heading":
        builder.heading({ level: block.level ?? 1 }, (h) => {
          h.rawText(block.text);
        });
        break;
      case "divider":
        builder.horizontalRule();
        break;
      case "link":
        builder.paragraph((p) => {
          p.link({ text: block.text, url: block.url });
        });
        break;
      case "inline":
        builder.paragraph((p) => {
          for (const part of block.parts) {
            if (part.type === "link") {
              p.link({ text: part.text, url: part.url });
            } else {
              p.text({ text: part.text });
            }
          }
        });
        break;
      case "links":
        builder.list({ ordered: false }, (list) => {
          for (const { title, url } of validLinks) {
            list.item((item) => {
              item.paragraph((p) => {
                p.link({ text: title, url });
              });
            });
          }
        });
        break;
      case "list":
        builder.list({ ordered: block.ordered ?? false }, (list) => {
          for (const text of block.items) {
            list.item((item) => {
              item.paragraph((p) => {
                p.text({ text });
              });
            });
          }
        });
        break;
      case "quote":
        builder.blockQuote({}, (bq) => {
          bq.paragraph((p) => {
            p.text({ text: block.text });
          });
        });
        break;
    }
  }

  return builder;
}
