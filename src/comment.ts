import { RichTextBuilder } from "@devvit/public-api";
import { CommentConfig, ValidLink } from "./types.js";

const DEFAULTS = {
  intro: "Hey there, thanks for sharing.",
  setup: "While you wait for people to comment, have a look at these posts which might be relevant to you:",
  outro: "Remember, even though it might feel like it, you are not alone. Stay strong!",
};

export function buildCommentRichtext(validLinks: ValidLink[], config?: CommentConfig | null): RichTextBuilder {
  return new RichTextBuilder()
    .paragraph((p) => {
      p.text({ text: config?.intro ?? DEFAULTS.intro });
    })
    .paragraph((p) => {
      p.text({ text: config?.setup ?? DEFAULTS.setup });
    })
    .list({ ordered: false }, (list) => {
      for (const { title, url } of validLinks) {
        list.item((item) => {
          item.paragraph((p) => {
            p.link({ text: title, url });
          });
        });
      }
    })
    .paragraph((p) => {
      p.text({ text: config?.outro ?? DEFAULTS.outro });
    })
    .paragraph((p) => {
      p.text({
        text: "This is an automated message. If you have any feedback or issues, post in ",
        formatting: [[2, 0, 74]],
      });
      p.link({
        text: "r/finddit_app",
        url: "https://www.reddit.com/r/finddit_app/",
        formatting: [[2, 0, 13]],
      });
      p.text({
        text: ".",
        formatting: [[2, 0, 1]],
      });
    });
}
