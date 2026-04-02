# Privacy Policy

**App:** finddit

**Last updated:** April 03, 2026

## 1. Overview

finddit is a Reddit app built with Devvit. This policy explains what data is processed when the app runs and how it is handled. Our practices comply with Reddit's Developer Terms, Developer Data Protection Addendum, and Devvit Rules.

---

## 2. Data we process

**On post creation**, the app processes:

- The **title** and **body text** of the post (publicly visible on Reddit)
- The post's **flair text**, if present (publicly visible metadata)
- For **crossposts**: the **body text of the parent post** (publicly visible on Reddit), used in place of the crosspost's empty body for embedding purposes

This data is used solely to find semantically similar posts and generate a helpful comment. We do not process usernames, user IDs, account information, or any other personal data.

**When a redditor clicks a result link** in one of the app's comments, the following is collected:

- The Reddit post ID of the link clicked
- The position of the link in the result list (0–4)
- The Reddit post ID of the triggering post that caused the comment
- The Reddit permalink of the clicked post
- The HTTP **User-Agent** header of the request (browser and OS information)

This data is used solely to measure which suggestions are being used and to improve result quality over time.

---

## 3. Basis for processing

Post titles and body text are publicly visible content on Reddit. The app processes this content automatically on post creation to provide the app's core functionality — surfacing related posts to help the author while they wait for replies.

---

## 4. Third-party services

Post text is sent to the following third-party services:

### OpenAI
- **What is sent:** The post title and body text
- **Why:** To generate a vector embedding (a numerical representation of the text's meaning) for similarity search
- **AI training:** Reddit data is not used to train, fine-tune, or improve any AI or machine learning model. The OpenAI API is used for inference only. OpenAI's own data usage is governed by their privacy policy.
- **Data retention:** Governed by [OpenAI's Privacy Policy](https://openai.com/policies/privacy-policy)

### Supabase
Supabase is used for two distinct operations:

**1. Similarity search (`match_documents_mental_health` RPC)**
- **What is sent:** The vector embedding only (a numerical array — not the original post text)
- **Why:** To perform a nearest-neighbor search against a pre-indexed database of Reddit posts

**2. Query event logging (`log_query_event` RPC)**
- **What is sent:** A structured operational record containing: the triggering post's Reddit post ID, the subreddit name, the post's flair text (if present), aggregate match counts (candidates, deleted, valid), whether a comment was posted, and per-match metadata (post ID, permalink, similarity score, deletion status). No post titles, body text, usernames, or account information are included.
- **Why:** To maintain database quality over time by tracking which indexed posts are still live, enabling stale and deleted entries to be purged from the vector index

**3. Click analytics (`clicks` table)**
- **What is sent:** When a redditor clicks a result link, the click is routed through a lightweight analytics redirect before landing on Reddit. The redirect logs: clicked post ID, link position (0–4), source post ID, Reddit permalink, an internal CTA configuration ID (an integer referencing which comment template was used — not a user identifier), and the User-Agent header of the request.
- **Why:** To measure engagement with suggestions and identify which result positions are most useful, informing future improvements to the ranking and matching logic.
- **What is stored:** Click records in the `clicks` table. No usernames, Reddit user IDs, or account information are stored.

**What is stored in the database:** Embeddings and Reddit permalinks of historical posts only. No usernames, user IDs, or personal information are stored in the index.

- **Data retention:** Governed by [Supabase's Privacy Policy](https://supabase.com/privacy)

### Discord
- **What is sent:** Operational log messages including post IDs, match counts, similarity scores, and error details. No post titles, body text, usernames, or other user-identifiable content is sent.
- **Why:** To monitor app activity and debug issues via a webhook to a private Discord channel
- **Data retention:** Governed by [Discord's Privacy Policy](https://discord.com/privacy)

---

## 5. Data we do not do

- We do not collect or store usernames, Reddit user IDs, or any account information
- We do not profile or infer personal characteristics of redditors (e.g. race, religion, health, political views, sexual orientation)
- We do not surveil redditors or track Reddit content for intelligence purposes
- We do not sell, license, share, or commercialize redditor data in any form
- We do not use Reddit data to train or fine-tune any AI, ML, LLM, or NLP model
- We do not use cookies
- Result links in app comments route through a click-tracking redirect that collects limited interaction data (post IDs, link position, User-Agent) before forwarding to Reddit. This data is used solely for improving result quality and is not shared or sold.

---

## 6. Data deletion and user rights

We respect redditors' right to deletion. You may request deletion of any data associated with your content by opening an issue at https://github.com/remuspoon/finddit/issues.

- **Post/comment deletions:** If a post or comment is deleted from Reddit, or gains protected status, any associated data (including embeddings stored in Supabase derived from that content) will be removed from our systems as soon as possible.
- **Click records:** Click interaction records (post IDs, link position, User-Agent) are stored in Supabase. These can be deleted on request. They contain no usernames or account identifiers, but may be traceable to a post author via post ID.
- **On request:** Any user may request deletion of their data at any time by contacting us at the link above.

---

## 7. Data minimization

We only process the minimum data necessary to provide the app's functionality. Post text is sent transiently to OpenAI and is not stored by the app itself.

---

## 8. Security

We take reasonable steps to keep the app and its data secure, including safeguards to prevent unauthorized access, loss, or disclosure of data. If we become aware of a data breach or unauthorized access, we will:

- Notify affected users and Reddit promptly
- Cooperate fully with Reddit and provide any information requested in connection with the incident
- Take immediate steps to remedy the breach or vulnerability

---

## 9. Children's privacy

This app is not directed at children under 13. Reddit's own age requirements apply. We do not knowingly transmit data relating to persons under 13.

---

## 10. Compliance

This app complies with Reddit's Developer Terms, Developer Data Protection Addendum, Data API Terms, Public Content Policy, and Devvit Rules.

---

## 11. Changes

This policy may be updated at any time. The "last updated" date at the top will reflect any changes.

---

## 12. Contact and deletion requests

For questions, concerns, or data deletion requests, open an issue at https://github.com/remuspoon/finddit/issues.
