//have each page as a image
//hold all images in the array
//when player clicks a choice that array number is called

class Journal {
  constructor() {
    this.isOpen = false;
    this.openPage = 0;
    this.totalPages = 5;

    this.pages = [
      { title: "Innkeeper", baseImage: innkeeperPg, textEntries: [] },
      { title: "Doctor", baseImage: doctorPg, textEntries: [] },
      { title: "RM", baseImage: rmPg, textEntries: [] },
      { title: "FDL", baseImage: fdlPg, textEntries: [] },
      { title: "Evidence", baseImage: evidencePg, textEntries: [] },
    ];
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  nextPage() {
    if (this.openPage < this.totalPages - 1) this.openPage++;
  }
  prevPage() {
    if (this.openPage > 0) this.openPage--;
  }

  // Called when player picks a dialogue option with a notebookEntry
  addTextEntry(pageIndex, text) {
    this.pages[pageIndex].textEntries.push(text);
  }

  display() {
    if (!this.isOpen) return;

    let page = this.pages[this.openPage];

    // Draw the base profile image as the page background
    image(page.baseImage, 100, 50, width - 200, height - 100);

    // Draw any unlocked text entries on top of the page
    if (page.textEntries.length > 0) {
      let entryX = 750;
      let entryY = height * 0.62; // position entries in the lower portion of the page
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
    fill(200);
    noStroke();
    rect(110, height / 2, 30, 30);
    rect(width - 140, height / 2, 30, 30);

    fill(80);
    textSize(18);
    textAlign(CENTER, CENTER);
    text("‹", 125, height / 2 + 15);
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
