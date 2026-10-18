<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Data access goes straight from the browser to the backend client; row-level policies (`has_role`) are the security boundary, so every new table needs policies for student-own and admin-all access.
- Roles live in `user_roles`; the signup trigger grants admin only to the first account requesting it, everyone else is a student — never read roles from user metadata.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate); admin pages under `_authenticated/admin*` re-check the admin role in `beforeLoad`.
- Feedback stats/CSV/validation logic lives in `src/lib/feedback.ts` and is covered by `src/test/feedback-rules.test.ts`.
