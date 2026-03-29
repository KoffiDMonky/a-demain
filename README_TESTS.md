# Tests — À Demain

Documentation dédiée à la suite de tests automatisés (Jest + React Native Testing Library).

---

## Stack

| Outil | Rôle |
|--------|------|
| **Jest** (`jest-expo`) | Runner, assertions, mocks |
| **@testing-library/react-native** | Rendu des composants, requêtes orientées utilisateur (`screen`, `fireEvent`, `waitFor`) |
| **@testing-library/jest-native** | Matchers additionnels (`toBeOnTheScreen`, etc.) via `jest.setup.js` |
| **@react-native-async-storage/async-storage** | Stockage réel mocké par Jest / persistance en mémoire entre tests |

---

## Commandes

```bash
# Toute la suite (recommandé en CI : évite souvent les soucis Watchman)
CI=true npm test

# Mode interactif (re-lance au changement de fichier)
npm run test:watch

# Un fichier ou un dossier
npm test -- --testPathPattern=HomeScreen
npm test -- __tests__/utils/storage.test.js

# Couverture sur un fichier précis
CI=true npm test -- --coverage --collectCoverageFrom='screens/HomeScreen.js' --testPathPattern=HomeScreen
```

**Watchman** : en local, si Jest échoue avec une erreur liée à Watchman, utiliser `CI=true npm test` ou `--watchAll=false`.

---

## Organisation des fichiers

```
__tests__/
├── App.test.js
├── components/
│   ├── CollapsedDeckPreview.test.js
│   ├── TaskItem.test.js
│   ├── TimePicker.test.js
│   └── TomorrowTaskItem.test.js
├── screens/
│   ├── HomeScreen.test.js
│   ├── NewTaskScreen.test.js
│   ├── PrivacyPolicyScreen.test.js
│   ├── StatsScreen.test.js
│   └── TomorrowScreen.test.js
└── utils/
    ├── achievements.test.js
    ├── applyHomeTaskStatus.test.js
    ├── notificationHelper.test.js
    ├── storage.test.js
    ├── streak.test.js
    └── tabBarIcons.test.js
```

Les tests vivent à côté de la logique métier par **domaine** (écrans, composants, utilitaires).

---

## Configuration Jest

Définie dans **`package.json`** (clé `"jest"`) :

- **`preset`** : `jest-expo`
- **`setupFilesAfterEnv`** : `jest.setup.js`

### `jest.setup.js` (global)

- Import des **matchers** `@testing-library/jest-native`.
- **Mock** de `react-native-gesture-handler/ReanimatedSwipeable` pour éviter le natif / Reanimated dans les tests de swipe (`TaskItem`, `TomorrowTaskItem`).
- Filtrage partiel des **`console.error` / `console.warn`** (warnings `act(...)` asynchrones, notifications).
- **Mock** de `SafeAreaProvider` : rend les enfants directement, pour que les écrans ne soient pas vides sous RTL.

### `moduleNameMapper`

Redirige certains modules vers des mocks maison dans **`__mocks/`** :

- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/bottom-tabs`

Les tests d’écran peuvent surcharger le comportement (ex. `useIsFocused`) via `jest.mock` dans le fichier de test.

---

## Pratiques courantes dans ce projet

### AsyncStorage

- **`beforeEach`** : `await AsyncStorage.clear()` pour repartir d’un stockage vide.
- Données de scénario : `AsyncStorage.setItem("tasks", JSON.stringify([...]))` avant `render`.

### Navigation

- `jest.fn()` pour `navigate` / `setOptions`.
- **`useIsFocused`** : souvent mocké avec `jest.fn(() => true)` ; certains tests passent à `false` pour couvrir la branche « écran non focus ».

### Composants lourds ou natifs

- **Lottie** : mock en `View` + enregistrement optionnel de `onAnimationFinish` (voir `HomeScreen.test.js`).
- **Notifications** : `jest.mock` sur `utils/notificationHelper`.
- **AnimatedCheckbox** / **LinearGradient** : mocks légers dans les tests de composants isolés (`TaskItem`, `CollapsedDeckPreview`).

### Mises à jour asynchrones

- Préférer **`findByText` / `findByRole`** et **`waitFor`** plutôt que `getBy*` immédiat après un `fireEvent` qui déclenche `async` + `setState`.

---

## Ajouter un test

1. Créer `__tests__/.../*.test.js` (ou colocaliser si vous changez la convention — aujourd’hui tout est sous `__tests__/`).
2. Importer React + RTL + le module sous test.
3. Mocker les dépendances externes (navigation, natif, fichiers lourds).
4. Lancer `npm test -- --testPathPattern=nomDuFichier`.

---

## Ressources

- [Testing Library — React Native](https://callstack.github.io/react-native-testing-library/)
- [Jest](https://jestjs.io/docs/getting-started)
- [jest-expo](https://github.com/expo/expo/tree/main/packages/jest-expo)

---

*Ce fichier est indépendant du [README principal](./README.md) (présentation produit et usage Expo).*
