const doctorDialogue = {
  opening: "Oh hi. Sorry, I'm still trying to process what happened.",
  repeatLine: "I don't really have anything else to say right now.",
  options: [
    {
      id: "A",
      cost: 3,
      playerLine: "You spoke up first… um did you know her?",
      npcResponse:
        "Not really. I suggested some medicine she could use for her cold, but she kept asking personal questions.",
      monologue: "I hope I didn't sound like I'm prying on her…",
      notebookEntry:
        "WD had a brief interaction with FDL — FDL was asking her personal questions.",
    },
    {
      id: "B",
      cost: 2,
      playerLine: "Did you sleep at all?",
      npcResponse:
        "Barely. I tried to, but you can't really shake the feeling after the scream.",
      monologue: "She didn't seem bothered… I think its fine?",
      notebookEntry: "Doctor claims she was in her room but couldn't sleep.",
    },
    {
      id: "C",
      cost: 0,
      playerLine: "...Hi",
      npcResponse: "Hi.",
      monologue:
        "That was so awkward… Maybe I should try talking with someone else…",
      notebookEntry: null,
    },
  ],
};

const doctor = new NPC(500, 400, doctorDialogue);
doctor.journalPageIndex = 1;

window.doctor = doctor;
