"use strict";

// import { header } from './data.js';

function combobox() {
  /*
   *   This content is licensed according to the W3C Software License at
   *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
   */

  "use strict";

  // Save a list of named combobox actions, for future readability
  var SelectActions = {
    Close: 0,
    CloseSelect: 1,
    First: 2,
    Last: 3,
    Next: 4,
    Open: 5,
    PageDown: 6,
    PageUp: 7,
    Previous: 8,
    Select: 9,
    Type: 10
  };
  var popo = 0;
  /*
   * Helper functions
   */

  // filter an array of options against an input string
  // returns an array of options that begin with the filter string, case-independent
  function filterOptions() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var filter = arguments.length > 1 ? arguments[1] : undefined;
    var exclude = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    return options.filter(option => {
      var matches = option.toLowerCase().indexOf(filter.toLowerCase()) === 0;
      return matches && exclude.indexOf(option) < 0;
    });
  }

  // map a key press to an action
  function getActionFromKey(event, menuOpen) {
    var {
      key,
      altKey,
      ctrlKey,
      metaKey
    } = event;
    var openKeys = ["ArrowDown", "ArrowUp", "Enter", " "]; // all keys that will do the default open action
    // handle opening when closed
    if (!menuOpen && openKeys.includes(key)) {
      return SelectActions.Open;
    }

    // home and end move the selected option when open or closed
    if (key === "Home") {
      return SelectActions.First;
    }
    if (key === "End") {
      return SelectActions.Last;
    }

    // handle typing characters when open or closed
    if (key === "Backspace" || key === "Clear" || key.length === 1 && key !== " " && !altKey && !ctrlKey && !metaKey) {
      return SelectActions.Type;
    }

    // handle keys when open
    if (menuOpen) {
      if (key === "ArrowUp" && altKey) {
        return SelectActions.CloseSelect;
      } else if (key === "ArrowDown" && !altKey) {
        return SelectActions.Next;
      } else if (key === "ArrowUp") {
        return SelectActions.Previous;
      } else if (key === "PageUp") {
        return SelectActions.PageUp;
      } else if (key === "PageDown") {
        return SelectActions.PageDown;
      } else if (key === "Escape") {
        return SelectActions.Close;
      } else if (key === "Enter" || key === " ") {
        return SelectActions.CloseSelect;
      }
    }
  }

  // return the index of an option from an array of options, based on a search string
  // if the filter is multiple iterations of the same letter (e.g "aaa"), then cycle through first-letter matches
  function getIndexByLetter(options, filter) {
    var startIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var orderedOptions = [...options.slice(startIndex), ...options.slice(0, startIndex)];
    var firstMatch = filterOptions(orderedOptions, filter)[0];
    var allSameLetter = array => array.every(letter => letter === array[0]);

    // first check if there is an exact match for the typed string
    if (firstMatch) {
      return options.indexOf(firstMatch);
    }

    // if the same letter is being repeated, cycle through first-letter matches
    else if (allSameLetter(filter.split(""))) {
      var matches = filterOptions(orderedOptions, filter[0]);
      return options.indexOf(matches[0]);
    }

    // if no matches, return -1
    else {
      return -1;
    }
  }

  // get an updated option index after performing an action
  function getUpdatedIndex(currentIndex, maxIndex, action) {
    var pageSize = 10; // used for pageup/pagedown

    switch (action) {
      case SelectActions.First:
        return 0;
      case SelectActions.Last:
        return maxIndex;
      case SelectActions.Previous:
        return Math.max(0, currentIndex - 1);
      case SelectActions.Next:
        return Math.min(maxIndex, currentIndex + 1);
      case SelectActions.PageUp:
        return Math.max(0, currentIndex - pageSize);
      case SelectActions.PageDown:
        return Math.min(maxIndex, currentIndex + pageSize);
      default:
        return currentIndex;
    }
  }

  // check if element is visible in browser view port
  function isElementInView(element) {
    var bounding = element.getBoundingClientRect();
    return bounding.top >= 0 && bounding.left >= 0 && bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) && bounding.right <= (window.innerWidth || document.documentElement.clientWidth);
  }

  // check if an element is currently scrollable
  function isScrollable(element) {
    return element && element.clientHeight < element.scrollHeight;
  }

  // ensure a given child element is within the parent's visible scroll area
  // if the child is not visible, scroll the parent
  function maintainScrollVisibility(activeElement, scrollParent) {
    var {
      offsetHeight,
      offsetTop
    } = activeElement;
    var {
      offsetHeight: parentOffsetHeight,
      scrollTop
    } = scrollParent;
    var isAbove = offsetTop < scrollTop;
    var isBelow = offsetTop + offsetHeight > scrollTop + parentOffsetHeight;
    if (isAbove) {
      scrollParent.scrollTo(0, offsetTop);
    } else if (isBelow) {
      scrollParent.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight);
    }
  }

  /*
   * Select Component
   * Accepts a combobox element and an array of string options
   */
  var Select = function Select(el) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    // element refs
    this.el = el;
    this.labelEl = el.querySelector(".cb-combo__label");
    this.inputlEl = el.querySelector(".cb-combo__input");
    this.comboEl = el.querySelector("[role=combobox]");
    this.listboxEl = el.querySelector("[role=listbox]");

    // data
    this.idBase = this.comboEl.id || "combo";
    this.options = options;

    // state
    this.activeIndex = -1;
    this.open = false;
    this.searchString = "";
    this.searchTimeout = null;

    // init
    if (el && this.comboEl && this.listboxEl) {
      this.init();
    }
  };
  Select.prototype.init = function () {
    // select first option by default
    this.comboEl.innerHTML = this.options[0];

    // add event listeners
    this.labelEl.addEventListener("click", this.onLabelClick.bind(this));
    this.comboEl.addEventListener("blur", this.onComboBlur.bind(this));
    this.listboxEl.addEventListener("focusout", this.onComboBlur.bind(this));
    this.comboEl.addEventListener("click", this.onComboClick.bind(this));
    this.comboEl.addEventListener("keydown", this.onComboKeyDown.bind(this));

    // create options
    this.options.map((option, index) => {
      var optionEl = this.createOption(option, index);
      this.listboxEl.appendChild(optionEl);
    });
  };
  Select.prototype.createOption = function (optionText, index) {
    var optionEl = document.createElement("a");
    optionEl.setAttribute("role", "option");
    optionEl.id = "".concat(this.idBase, "-").concat(index);
    optionEl.className = "cb-combo__option";
    // optionEl.setAttribute("aria-selected", `${index === 0}`);
    optionEl.innerText = optionText.title;
    optionEl.href = optionText.url;
    optionEl.addEventListener("click", event => {
      event.stopPropagation();
      this.onOptionClick(index);
    });
    optionEl.addEventListener("mousedown", this.onOptionMouseDown.bind(this));
    this.inputlEl.innerText = "";
    return optionEl;
  };
  Select.prototype.getSearchString = function (char) {
    // reset typing timeout and start new timeout
    // this allows us to make multiple-letter matches, like a native select
    if (typeof this.searchTimeout === "number") {
      window.clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = window.setTimeout(() => {
      this.searchString = "";
    }, 500);

    // add most recent letter to saved search string
    this.searchString += char;
    return this.searchString;
  };
  Select.prototype.onLabelClick = function () {
    this.comboEl.focus();
  };
  Select.prototype.onComboBlur = function (event) {
    // do nothing if relatedTarget is contained within listboxEl
    if (this.listboxEl.contains(event.relatedTarget)) {
      return;
    }

    // select current option and close
    if (this.open) {
      this.selectOption(this.activeIndex);
      this.updateMenuState(false, false);
    }
  };
  Select.prototype.onComboClick = function () {
    this.updateMenuState(!this.open, false);
  };
  Select.prototype.onComboKeyDown = function (event) {
    var {
      key
    } = event;
    var max = this.options.length - 1;
    var action = getActionFromKey(event, this.open);
    switch (action) {
      case SelectActions.Last:
      case SelectActions.First:
        this.updateMenuState(true);
      // intentional fallthrough
      case SelectActions.Next:
      case SelectActions.Previous:
      case SelectActions.PageUp:
      case SelectActions.PageDown:
        event.preventDefault();
        return this.onOptionChange(getUpdatedIndex(this.activeIndex, max, action));
      case SelectActions.CloseSelect:
        event.preventDefault();
        this.selectOption(this.activeIndex);
      // intentional fallthrough
      case SelectActions.Close:
        event.preventDefault();
        return this.updateMenuState(false);
      case SelectActions.Type:
        return this.onComboType(key);
      case SelectActions.Open:
        event.preventDefault();
        return this.updateMenuState(true);
    }
  };
  Select.prototype.onComboType = function (letter) {
    // open the listbox if it is closed
    this.updateMenuState(true);

    // find the index of the first matching option
    var searchString = this.getSearchString(letter);
    var searchIndex = getIndexByLetter(this.options, searchString, this.activeIndex + 1);

    // if a match was found, go to it
    if (searchIndex >= 0) {
      this.onOptionChange(searchIndex);
    }
    // if no matches, clear the timeout and search string
    else {
      window.clearTimeout(this.searchTimeout);
      this.searchString = "";
    }
  };
  Select.prototype.onOptionChange = function (index) {
    // update state
    this.activeIndex = index;

    // update aria-activedescendant
    this.comboEl.setAttribute("aria-activedescendant", "".concat(this.idBase, "-").concat(index));

    // update active option styles
    var options = this.el.querySelectorAll("[role=option]");
    [...options].forEach(optionEl => {
      optionEl.classList.remove("option__current");
    });
    options[index].classList.add("option__current");

    // ensure the new option is in view
    if (isScrollable(this.listboxEl)) {
      maintainScrollVisibility(options[index], this.listboxEl);
    }

    // ensure the new option is visible on screen
    // ensure the new option is in view
    if (!isElementInView(options[index])) {
      options[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  };
  Select.prototype.onOptionClick = function (index) {
    this.onOptionChange(index);
    this.selectOption(index);
    this.updateMenuState(false);
  };
  Select.prototype.onOptionMouseDown = function () {
    // Clicking an option will cause a blur event,
    // but we don't want to perform the default keyboard blur action
    this.ignoreBlur = true;
  };
  Select.prototype.selectOption = function (index) {
    if (index > -1) {
      // update state
      this.activeIndex = index;

      // update displayed value
      var selected = this.options[index];
      this.comboEl.innerHTML = selected.title;

      // update aria-selected
      var options = this.el.querySelectorAll("[role=option]");
      [...options].forEach(optionEl => {
        optionEl.setAttribute("aria-selected", "false");
      });
      options[index].setAttribute("aria-selected", "true");
      this.inputlEl.innerText = "";
    }
  };
  Select.prototype.updateMenuState = function (open) {
    var callFocus = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    if (this.open === open) {
      return;
    }

    // update state
    this.open = open;

    // update aria-expanded and styles
    this.comboEl.setAttribute("aria-expanded", "".concat(open));
    open ? this.el.classList.add("open") : this.el.classList.remove("open");

    // update activedescendant
    var activeID = open ? "".concat(this.idBase, "-").concat(this.activeIndex) : "";
    this.comboEl.setAttribute("aria-activedescendant", activeID);
    if (activeID === "" && !isElementInView(this.comboEl)) {
      this.comboEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }

    // move focus back to the combobox, if needed
    callFocus && this.comboEl.focus();
  };

  // init select
  window.addEventListener("load", function () {
    var options = [{
      title: "Cirugía y tratamiento de juanetes",
      url: "page-2.html"
    }, {
      title: "Tratamiento de papilomas",
      url: "page-2.html"
    }, {
      title: "Podología deportiva",
      url: "page-2.html"
    }];
    var selectEls = document.querySelectorAll(".js-select");
    selectEls.forEach(el => {
      new Select(el, options);
    });
  });
}
function carousel() {
  $('.cb-carousel').slick({
    infinite: false,
    slidesToShow: 2,
    slidesToScroll: 1,
    variableWidth: true
  });
}
function menuMobile(params) {
  var btnMenu = document.querySelector('.cb-button__menu');
  var menu = document.querySelector('.cb-header__nav');
  btnMenu.addEventListener('click', e => {
    menu.classList.toggle('open');
  });
}
menuMobile();
combobox();
carousel();