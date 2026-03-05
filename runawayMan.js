const runawayManDialogue = {
  opening: "Everyone's on edge… what do you want?",
  repeatLine: "…I already said what I had to say.",
  options: [
    {
      id: "A",
      cost: 3,
      playerLine:
        "I didn't do anything. I want to understand what happened. Where were you?",
      npcResponse:
        "I was in my room the whole time! I already talked with the innkeeper, and I do not want to repeat myself to every stranger who comes up to me.",
      monologue: "Did I say something wrong? Why did he get worked up?…",
      notebookEntry: "RM claims he was in his room — got defensive quickly.",
    },
    {
      id: "B",
      cost: 2,
      playerLine: "Rough night?",
      npcResponse:
        "You don't say. I wanted to check out and leave, but now I'm stuck here.",
      monologue: "Maybe he is just as anxious as I am…",
      notebookEntry:
        "RM was planning to leave — seemed eager to get out before the lockdown.",
    },
    {
      id: "C",
      cost: 0,
      playerLine: "Sorry… I was just passing by",
      npcResponse: "…Don't drag me into anything.",
      monologue: "Maybe I should talk with other guests here.",
      notebookEntry: null,
    },
  ],
};

const runawayMan = new NPC(700, 500, runawayManDialogue);
runawayMan.journalPageIndex = 2;

window.runawayMan = runawayMan;
