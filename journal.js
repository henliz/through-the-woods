class Journal {
  constructor() {
    this.isOpen = false;
    this.openPage = 0;
    this.totalPages = 5;

    this.pages = [
      {
        title: "Innkeeper",
        baseImage: innkeeperPg,
        textEntries: [],
        hasNew: false,
      },
      { title: "Doctor", baseImage: doctorPg, textEntries: [], hasNew: false },
      { title: "RM", baseImage: rmPg, textEntries: [], hasNew: false },
      { title: "FDL", baseImage: fdlPg, textEntries: [], hasNew: false },
      {
        title: "Evidence",
        baseImage: evidencePg,
        textEntries: [],
        hasNew: false,
      },
    ];

    this.hasUnread = false;
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.pages[this.openPage].hasNew = false;
      this._recalcUnread();
    }
  }

  nextPage() {
    if (this.openPage < this.totalPages - 1) {
      this.openPage++;
      this.pages[this.openPage].hasNew = false;
      this._recalcUnread();
    }
  }

  prevPage() {
    if (this.openPage > 0) {
      this.openPage--;
      this.pages[this.openPage].hasNew = false;
      this._recalcUnread();
    }
  }

  addTextEntry(pageIndex, text) {
    this.pages[pageIndex].textEntries.push(text);
    this.pages[pageIndex].hasNew = true;
    this._recalcUnread();
  }

  _recalcUnread() {
    this.hasUnread = this.pages.some((p) => p.hasNew);
  }

  display() {
    if (!this.isOpen) return;
    textFont(journalFont);

    let page = this.pages[this.openPage];
    image(page.baseImage, width * 0.29, height * 0.15, 650, 650);

    if (page.textEntries.length > 0) {
      let entryX = width * 0.29 + 350;
      let entryY = 250;
      let entryW = 650 / 2 - 90;

      fill(40, 20, 10);
      textSize(18);
      textAlign(LEFT, TOP);
      textStyle(ITALIC);
      for (let i = 0; i < page.textEntries.length; i++) {
        text("• " + page.textEntries[i], entryX, entryY + i * 75, entryW, 200);
      }
      textStyle(NORMAL);
      textFont(jersey10Font); // reset at the end
    }
    textFont(jersey10Font);

    this.drawArrows();
  }

  drawArrows() {
    noStroke();

    fill(this.openPage > 0 ? color(160, 120, 80) : color(100, 100, 100, 60));
    rect(width * 0.28, height / 2, 30, 30, 4);
    fill(this.openPage > 0 ? 255 : 190);
    textSize(18);
    textAlign(CENTER, CENTER);
    text("‹", width * 0.29, height / 2 + 15);

    fill(
      this.openPage < this.totalPages - 1
        ? color(160, 120, 80)
        : color(100, 100, 100, 60),
    );
    rect(width * 0.28 + 650, height / 2, 30, 30, 4);
    fill(this.openPage < this.totalPages - 1 ? 255 : 150);
    text("›", width * 0.29 + 650, height / 2 + 15);
  }

  handleClick(mx, my) {
    if (!this.isOpen) return;
    if (mx > 110 && mx < 140 && my > height / 2 && my < height / 2 + 30)
      this.prevPage();
    if (
      mx > width - 140 &&
      mx < width - 110 &&
      my > height / 2 &&
      my < height / 2 + 30
    )
      this.nextPage();
  }
}
