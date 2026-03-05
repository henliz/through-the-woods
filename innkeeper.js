//this is all the information for the innkeeper

const innkeeperDialogue = {
  opening:
    "Tsk, this is terrible. My inn's reputation will be ruined… What do you want, girl?",
  repeatLine:
    "I'm busy. Don't bother me unless you have something useful to say.",
  options: [
    {
      id: "A",
      cost: 3,
      playerLine:
        "I just wanted to know what happened last night. Can you tell me what you saw?",
      npcResponse:
        "What I saw? I heard a scream and found Front Desk Lady…dead. Don’t ask me more question troublemaker, I have guests to manage!",
      monologue:
        "Should I have phrased that differently? He probably thinks I'm nosy…",
      notebookEntry:
        "Innkeeper heard the scream but claims to know nothing more.",
    },
    {
      id: "B",
      cost: 2,
      playerLine: "…Are you okay?",
      npcResponse: "Of course not. Someone is dead in my Inn.",
      monologue:
        "At least he didn't yell at me this time. Maybe it wasn't too awkward.",
      notebookEntry:
        "Innkeeper seems more distressed about the Inn's reputation than the death itself.",
    },
    {
      id: "C",
      cost: 0,
      playerLine: "Sorry…nevermind",
      npcResponse: "If you're not helping, don't get in the way.",
      monologue: "Maybe I should talk to the other guests.",
      notebookEntry: null,
    },
  ],
};

const innkeeper = new NPC(300, 400, innkeeperDialogue);

window.innkeeper = innkeeper;
