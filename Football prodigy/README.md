# Football Probability

A football-only mobile app that estimates match outcome probabilities using recent form,
home advantage, attack/defence strength, league strength, head-to-head data and optional
market/availability inputs.

## Coverage

The app is designed around a football data provider rather than a hard-coded league list.
API-Football currently advertises 1,247 leagues and cups, including major domestic and
international competitions. Provider coverage varies by season and endpoint.

Examples:
- FIFA World Cup
- UEFA Champions League
- UEFA Europa League
- UEFA Conference League
- CAF Champions League
- CAF Confederation Cup
- CAF Super Cup
- Copa Libertadores
- Copa Sudamericana
- AFC Champions League Elite
- CONCACAF Champions Cup
- domestic leagues and cups worldwide

## Run

1. Install Node.js.
2. Install Expo CLI dependencies with `npm install`.
3. Copy `.env.example` to `.env`.
4. Put your API-Football key in `EXPO_PUBLIC_API_FOOTBALL_KEY`.
5. Run `npx expo start`.

For production, move the provider key behind your own backend instead of shipping it
inside the mobile application.

## Important

The probability engine is an analytical estimate, not a guarantee of an outcome.
Do not represent the percentages as certain results.


## Phase 2 model

The app now uses an expected-goals + Poisson framework. It produces:
- 1X2 probabilities
- expected goals
- BTTS
- over/under 2.5
- top scorelines
- model confidence based on outcome-distribution concentration

The model accepts recent form, goal rates, attack/defence ratings, points per game,
clean-sheet rate, goal difference, rest days, injuries, venue and competition context.
The next production step is historical back-testing/calibration by competition before
publishing accuracy claims.

## Build an Android APK

Install dependencies:

    npm install
    npm install -g eas-cli
    eas login
    eas build:configure
    eas build -p android --profile preview

The included `eas.json` requests an APK for the preview profile. For Google Play,
use the production profile to build an Android App Bundle instead.
