import { RichTextBuilder } from "@devvit/public-api";
import { ValidLink } from "./types.js";

export function buildCommentRichtext(validLinks: ValidLink[]): RichTextBuilder {
  return new RichTextBuilder()
    .paragraph((p) => {
      p.text({ text: "Hey there, thanks for sharing." });
    })
    .paragraph((p) => {
      p.text({ text: "While you wait for people to comment, have a look at these posts which might be relevant to you:" });
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
      p.text({ text: "Remember, even though it might feel like it, you are not alone. Stay strong!" });
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
