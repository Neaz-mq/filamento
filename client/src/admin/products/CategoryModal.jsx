import { useId, useState } from "react";
import Modal from "./Modal";
import { CategoryPicture } from "./CategoryArt";
import { CATEGORIES } from "./catalog";
import { IconBox, IconCheck, IconChevron, IconClose, IconHelp } from "../icons";

/* ===============================================================
   Add Product চাপলে প্রথমে — Choose a Category (Figma: 800 × 618)

   ৮টা ঘর আসলে radio বোতাম: তির চিহ্ন দিয়ে এক ঘর থেকে আরেক ঘরে
   যাওয়া যায়, screen reader ও "৮টার মধ্যে ১" পড়ে. দুইবার চাপলে
   (double click) সরাসরি Continue.

   "Need help choosing …" এ চাপলে প্রতিটা category র এক লাইনের
   বর্ণনা খোলে
   =============================================================== */

function CategoryModal({ initial = "lamp-fixture", onClose, onContinue }) {
  const [picked, setPicked] = useState(initial);
  const [helpOpen, setHelpOpen] = useState(false);
  const titleId = useId();
  const helpId = useId();

  return (
    <Modal
      size="lg"
      onClose={onClose}
      labelledBy={titleId}
      className="pd-cat-modal"
      initialFocus="input[type=radio]:checked"
      footer={
        <>
          <button
            type="button"
            className="pd-btn pd-btn--line pd-btn--grow pd-btn--lg"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="pd-btn pd-btn--yellow pd-btn--grow pd-btn--lg"
            onClick={() => onContinue(picked)}
            disabled={!picked}
          >
            Continue
          </button>
        </>
      }
    >
      <header className="pd-modal-head">
        <div className="pd-modal-head-left">
          <span className="pd-modal-badge">
            <IconBox size={20} />
          </span>
          <div>
            <p className="pd-modal-kicker">
              Select the product category. You can always change it later.
            </p>
            <h2 id={titleId} className="pd-modal-title">
              Choose a Category
            </h2>
          </div>
        </div>
        <button
          type="button"
          className="pd-modal-x"
          onClick={onClose}
          aria-label="Close"
        >
          <IconClose size={16} />
        </button>
      </header>

      <div className="pd-modal-body">
        <div className="pd-cat-grid" role="radiogroup" aria-labelledby={titleId}>
          {CATEGORIES.map((category) => {
            const on = picked === category.key;
            return (
              <label
                key={category.key}
                className={`pd-cat${on ? " is-on" : ""}`}
                onDoubleClick={() => onContinue(category.key)}
              >
                <input
                  type="radio"
                  name="product-category"
                  className="sr-only"
                  value={category.key}
                  checked={on}
                  onChange={() => setPicked(category.key)}
                />
                {on && (
                  <span className="pd-cat-tick" aria-hidden="true">
                    <IconCheck size={10} />
                  </span>
                )}
                <span className="pd-cat-art">
                  <CategoryPicture category={category} />
                </span>
                <span className="pd-cat-name">{category.label}</span>
              </label>
            );
          })}
        </div>

        <div className={`pd-help${helpOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="pd-help-head"
            onClick={() => setHelpOpen((open) => !open)}
            aria-expanded={helpOpen}
            aria-controls={helpId}
          >
            <span className="pd-help-icon">
              <IconHelp size={14} />
            </span>
            <span className="pd-help-text">
              <strong>Need help choosing the right category?</strong>
              <span>
                Each category has specific features and specifications. Select
                the one that best matches your product.
              </span>
            </span>
            <span className="pd-help-caret">
              <IconChevron size={16} />
            </span>
          </button>

          <dl id={helpId} className="pd-help-list" hidden={!helpOpen}>
            {CATEGORIES.map((category) => (
              <div key={category.key}>
                <dt>{category.label}</dt>
                <dd>{category.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Modal>
  );
}

export default CategoryModal;
