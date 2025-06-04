# Joker's Wild Hand Oracle 🃏🔮

An interactive web-based Balatro helper designed to assist players in identifying the best possible poker hands they can play from their available cards. It also provides video-poker style discard advice and features a playful, Joker-themed interface with dark and light mode support.

**Live Demo**

## Features

*   **Hand Evaluation:** Identifies all standard 5-card poker hands (High Card to Royal Flush).
*   **Best Hand Suggestion:** Shows the strongest 5-card hand playable from the input cards.
*   **Discard Advice:** Provides "video poker" style advice on which cards to hold or discard from the best 5-card hand to potentially improve it.
*   **Multiple Input Methods:**
    *   **Clickable Card Deck:** Visually select cards from a full deck displayed in rank order.
    *   **Drag & Drop:** Drag cards from the deck to your hand, or drag cards from your hand back to the deck to discard.
    *   **Text Input:** Type card strings (e.g., "AH KS TC 2D 7C").
    *   **Autocomplete:** Get suggestions with card images as you type.
*   **Interactive UI:**
    *   Fun Joker/Balatro inspired theme.
    *   Dark and Light mode support (persists with localStorage).
    *   Animations for card selection and results reveal.
    *   (Optional) Sound effects for user interactions.
*   **Responsive Design:** Aims to be usable on various screen sizes.
*   **Client-Side Logic:** All calculations and interactions happen directly in the browser using HTML, CSS, and JavaScript.

## How to Use

1.  **Input Your Cards:**
    *   **Click:** Click on the card images in the "Pick Your Cards, Trickster!" section. Selected cards will appear in "Your Hand of Mayhem."
    *   **Drag & Drop:** Drag card images from the deck area and drop them into the "Your Hand of Mayhem" zone. To remove a card from your hand, drag it from "Your Hand of Mayhem" back to the deck area.
    *   **Type:** Enter card strings directly into the text input field (e.g., `AH KD QS JC TC`). Use standard notation:
        *   Ranks: `A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2`
        *   Suits: `S` (Spades), `H` (Hearts), `D` (Diamonds), `C` (Clubs)
        *   Separate cards with spaces.
2.  **Hand Limit:** You can select/input up to 8 cards (a common Balatro hand limit).
3.  **Clear Hand:** Use the "Banish All!" button to clear your current selection.
4.  **Evaluate:** Click the "Reveal the Ruckus!" button.
5.  **View Results:**
    *   The app will display your evaluated hand.
    *   The "Wildest Play Unveiled!" section shows the best 5-card poker hand you can make.
    *   "Joker's Cunning Counsel" gives advice on what to keep/discard from that best 5-card hand.
    *   "Other Shenanigans" lists other strong hands you could form.
6.  **Toggle Theme:** Use the ☀️/🃏 button in the header to switch between light and dark modes.

## Local Setup

To run this project locally:

1.  **Clone or Download:** Get the project files (`index.html`, `style.css`, `script.js`).
2.  **Asset Folders:**
    *   Create a folder named `card_images` in the same directory as `index.html`.
    *   Place all 52 standard playing card images (e.g., `AH.png`, `2S.png`, `KD.png`) into the `card_images` folder. Ensure filenames match the `RANKSUIT.png` format.
    *   (Optional) Create a `sounds` folder and add audio files (`card_select.mp3`, `card_drop.wav`, etc.) if you plan to enable sound effects in the code.
    *   Place your `joker_favicon.png` in the root project directory.
3.  **Open `index.html`:** Open the `index.html` file in your web browser.

No special build steps or server is required as it's a client-side application.

## Tech Stack

*   HTML5
*   CSS3 (with CSS Variables, Flexbox, Grid, Animations)
*   Vanilla JavaScript (ES6+)

## Future Enhancements (Ideas)

*   **Balatro-Specific Scoring:** Integrate actual Balatro point scoring for hands.
*   **Joker Card Effects:** Allow input of active Joker cards and factor their effects into hand suggestions or scoring.
*   **Voucher/Booster Pack Simulation:** Consider effects of in-game items.
*   **More Advanced Discard Strategy:** Discard logic could be enhanced based on probabilities of drawing specific cards (more complex).
*   **Reordering Selected Cards:** Allow drag-and-drop reordering within the "Your Hand of Mayhem" area.
*   **Enhanced Touch Support:** For more robust drag-and-drop on mobile devices using a dedicated library.
*   **Configuration Options:** Allow users to set hand size limits, choose default themes, etc.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/hiericho/balatrohelper/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.#balatrohelper
