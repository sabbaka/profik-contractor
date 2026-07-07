# Fastlane — App Store Connect metadata for Profik Pro

This folder lets you push all App Store listing text (description, keywords, support URLs, review notes, etc.) to App Store Connect in one command, so you don't have to paste fields into the web UI.

The app's store title is **Profik Pro** (bundle ID `com.profik.contractor`). Because the bundle ID is new, the App Store Connect app record has to be created first — either during your first `eas submit -p ios`, via fastlane `produce`, or manually in the ASC UI (New App → iOS → name "Profik Pro" → bundle ID `com.profik.contractor`).

After you create the demo contractor account below and run `fastlane push_metadata`, the only things left to do in the App Store Connect UI are:

- Upload screenshots (Fastlane can do this too — drop PNGs into `fastlane/screenshots/<locale>/` and run `push_metadata_and_screenshots`)
- Set Age Rating (questionnaire — not exposed via Fastlane)
- Set Pricing and Availability
- Attach the production build (from `eas build -p ios --profile production` + `eas submit`) to the version
- Click **Submit for Review** (or run `fastlane submit_for_review`)

## Before running

Fill the remaining demo account TODOs (`grep -R TODO fastlane/`):

| File | What goes there |
|---|---|
| `fastlane/metadata/review_information/demo_user.txt` | Demo **contractor** account phone number (the app uses phone + password login) |
| `fastlane/metadata/review_information/demo_password.txt` | Demo account password |

Apple **will reject the app** if you don't provide a working demo account — the review team has to be able to sign in. The demo account must be a real **contractor** account in the production database, with at least one open job visible nearby and one active offer chat, so reviewers can walk the browse → offer → chat flow described in `review_information/notes.txt`.

The listing texts are maintained in `store.config.json` at the repo root — treat it as the source of truth and regenerate/keep the `metadata/` txt files in sync when you edit it.

## Installing Fastlane

From the `profik-contractor/` directory (parent of this folder):

```bash
# Install Bundler if you don't have it
gem install bundler

# Create a Gemfile (only once)
cat > Gemfile <<'EOF'
source "https://rubygems.org"
gem "fastlane"
EOF

bundle install
```

## Authenticating with an App Store Connect API Key

Fastlane reads the key from three environment variables: `ASC_KEY_ID`, `ASC_ISSUER_ID`, and `ASC_KEY_FILEPATH`. This is a **team** key — the same key already used for the Profik client app works here too; no new key needed.

### 1. Create the API key (once per team)

1. https://appstoreconnect.apple.com → **Users and Access** → **Integrations** tab → **App Store Connect API** → **Team Keys**.
2. Click **+** → **Generate API Key**.
3. **Name**: e.g. `Fastlane Profik`. **Access**: **App Manager** (enough for metadata + submit).
4. Note the **Issuer ID** (shown at the top of the page) and the **Key ID** (the row's `Key ID` column).
5. Click **Download API Key**. Apple lets you download the `.p8` file only once — save it somewhere safe (and out of this repo).

Suggested location:
```bash
mkdir -p ~/.appstoreconnect/private_keys
mv ~/Downloads/AuthKey_*.p8 ~/.appstoreconnect/private_keys/
chmod 600 ~/.appstoreconnect/private_keys/AuthKey_*.p8
```

### 2. Export the env vars

Add these to your shell profile (`~/.zshrc`) or export them per-session:

```bash
export ASC_KEY_ID='XXXXXXXXXX'                                            # 10-char key ID
export ASC_ISSUER_ID='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'              # UUID
export ASC_KEY_FILEPATH="$HOME/.appstoreconnect/private_keys/AuthKey_XXXXXXXXXX.p8"
```

After editing `.zshrc`: `source ~/.zshrc`. Confirm with `echo $ASC_KEY_ID`.

### 3. (Optional) Use the same key for `eas submit`

EAS recognizes the same key via these env vars — set them once and both tools work:

```bash
export EXPO_ASC_API_KEY_PATH="$ASC_KEY_FILEPATH"
export EXPO_ASC_API_KEY_ID="$ASC_KEY_ID"
export EXPO_ASC_API_ISSUER_ID="$ASC_ISSUER_ID"
```

## Running

From the `profik-contractor/` directory:

```bash
# Push only the text metadata (no screenshots, no binary)
bundle exec fastlane push_metadata

# Or, once you have screenshots in fastlane/screenshots/<locale>/
bundle exec fastlane push_metadata_and_screenshots

# Once everything looks right in App Store Connect (build attached, age rating set, pricing set):
bundle exec fastlane submit_for_review
```

No 2FA prompts, no app-specific passwords — the API key handles it all.

## Screenshots

If you want Fastlane to manage screenshots, drop PNGs into:

```
fastlane/screenshots/
  en-US/
    01-open-jobs.png
    02-job-detail.png
    03-send-offer.png
    04-offer-chat.png
    ...
  cs/
    ...
  sk/
    ...
```

Apple's required sizes (`supportsTablet: false` in app.config.ts, so **no iPad screenshots needed**):

- 6.9" iPhone (1320×2868) — at least 1, up to 10
- 6.5" iPhone (1242×2688) — at least 1

You can capture them via `expo run:ios` with the simulator at each device size, or use a tool like Fastlane's `snapshot`.

## What this won't do

- Submit a new binary — that's `eas submit` from `eas.json` (or `bundle exec fastlane pilot upload`)
- Set the age rating questionnaire — must be done in ASC UI
- Set price/availability — must be done in ASC UI
- Answer the export compliance question — already covered by `ITSAppUsesNonExemptEncryption: false` in `app.config.ts`

## File layout reference

```
fastlane/
├── Appfile                # App identifier and Apple ID
├── Deliverfile            # Default options for deliver
├── Fastfile               # Lanes (push_metadata, submit_for_review)
├── README.md              # This file
└── metadata/
    ├── copyright.txt
    ├── primary_category.txt
    ├── secondary_category.txt
    ├── en-US/
    │   ├── name.txt
    │   ├── subtitle.txt
    │   ├── promotional_text.txt
    │   ├── description.txt
    │   ├── keywords.txt
    │   ├── release_notes.txt
    │   ├── support_url.txt
    │   ├── marketing_url.txt
    │   └── privacy_url.txt
    ├── cs/  (same files)
    ├── sk/  (same files)
    └── review_information/
        ├── first_name.txt
        ├── last_name.txt
        ├── phone_number.txt
        ├── email_address.txt
        ├── demo_user.txt
        ├── demo_password.txt
        └── notes.txt
```
