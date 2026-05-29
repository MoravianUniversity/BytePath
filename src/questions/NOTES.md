Adding a new question type
==========================

* In `questions/types.ts`:
    - Add the question type string name to the `QuestionKind` enum in `types.ts`
    - Create a new interface that extends `QuestionBase<K>` in `types.ts`
    - Add the `Question` type to the `Question` union in `types.ts`
    - Add the answer type to the `UserAnswerFor<K>` union in `types.ts`

* Create the question definition in `questions/<question-type>.tsx`:
    - Needs to define the `checkAnswer` and `serializeResponse` functions, and the `View` component

* In `questions/registry.ts`:
    - Add the question definition to the `QUESTION_TYPES` object in `registry.ts`

* Optionally, in `topics.ts`:
    - Create a new abstract class that extends `Subtopic<K>` in `topics.ts`

* Optionally, somewhere create a function that generates a question of the new type
