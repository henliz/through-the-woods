//have each page as a image
//hold all images in the array
//when player clicks a choice that array number is called

class Journal {
  constructor() {
    this.isOpen = false;
    this.openPage = 0;

    this.totalPages = 5;

    // Data storage array
    this.pages = [
      { title: "NPC 1", entries: [fdlPg] },
      { title: "NPC 2", entries: [doctorPg] },
      { title: "NPC 3", entries: [rmPg] },
      { title: "NPC 4", entries: [innkeeperPg] },
      { title: "Evidence", entries: [evidencePg] },
    ];
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  //switch between pages
  nextPage() {
    if (this.openPage < this.totalPages - 1) {
      this.openPage++;
    }
  }

  prevPage() {
    if (this.openPage > 0) {
      this.openPage--;
    }
  }

  //update journal (jounral.addEntry(1-4,image variable name))
  addEntry(pageNum, clue) {
    this.pages[pageNum].entries.push(clue);
  }

  //journal
  display() {
    if (!this.isOpen) return;

    // Entries
    textSize(16);
    textAlign(LEFT);
    let entries = this.pages[this.openPage].entries;

    for (let i = 0; i < entries.length; i++) {
      image(entries[i], 100, 50, width - 200, height - 100);
    }

    // Arrows
    this.drawArrows();
  }

  drawArrows() {
    fill(200);

    // Left arrow
    rect(110, height / 2, 30, 30);

    // Right arrow
    rect(width - 140, height / 2, 30, 30);
  }

  handleClick(mx, my) {
    if (!this.isOpen) return;

    // Left arrow click
    if (mx > 110 && mx < 140 && my > height / 2 && my < height / 2 + 30) {
      this.prevPage();
    }

    // Right arrow click
    if (
      mx > width - 140 &&
      mx < width - 110 &&
      my > height / 2 &&
      my < height / 2 + 30
    ) {
      this.nextPage();
    }
  }
}
