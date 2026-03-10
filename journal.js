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

    let page = this.pages[this.openPage];
    image(page.baseImage, 100, 50, width - 200, height - 100);

    if (page.textEntries.length > 0) {
      let entryX = 750;
      let entryY = 250;
      let entryW = width - 260;

      fill(40, 20, 10);
      textSize(14);
      textAlign(LEFT, TOP);
      textStyle(ITALIC);
      for (let i = 0; i < page.textEntries.length; i++) {
        text("• " + page.textEntries[i], entryX, entryY + i * 30, entryW, 28);
      }
      textStyle(NORMAL);
    }

    this.drawArrows();
  }

  drawArrows() {
    noStroke();

    fill(this.openPage > 0 ? color(160, 120, 80) : color(100, 100, 100, 60));
    rect(110, height / 2, 30, 30, 4);
    fill(this.openPage > 0 ? 255 : 150);
    textSize(18);
    textAlign(CENTER, CENTER);
    text("‹", 125, height / 2 + 15);

    fill(
      this.openPage < this.totalPages - 1
        ? color(160, 120, 80)
        : color(100, 100, 100, 60),
    );
    rect(width - 140, height / 2, 30, 30, 4);
    fill(this.openPage < this.totalPages - 1 ? 255 : 150);
    text("›", width - 125, height / 2 + 15);
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
