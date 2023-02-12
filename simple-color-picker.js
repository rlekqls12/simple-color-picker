class SimpleColorPickerConstant {
  static SHOW = "SHOW";
  static HIDE = "HIDE";
  static COLOR_PICKER_CANCEL = "COLOR_PICKER_CANCEL";
  static COLOR_PICKER_CHANGE = "COLOR_PICKER_CHANGE";
  static EVENT_FOCUS = "focus";
  static EVENT_INPUT = "input";
  static EVENT_CHANGE = "change";
  static EVENT_CLOSE = "close";
}

class SimpleColorPicker {
  #element = null;
  #layout = new SimpleColorPickerLayout();
  showStatus = SimpleColorPickerConstant.HIDE;
  beforeOpenValue = null;

  constructor(element) {
    this.showColorPicker = this.showColorPicker.bind(this);
    this.hideColorPicker = this.hideColorPicker.bind(this);
    this.#executeElementEvent = this.#executeElementEvent.bind(this);

    this.setElement(element);
  }

  setElement(element) {
    if (this.#element) {
      this.hideColorPicker();
      delete this.#element.simpleColorPicker;
      this.#removeFocusEvent();
    }

    this.#element = this.#getElement(element);
    this.#element.simpleColorPicker = this;
    this.#addFocusEvent();
  }

  showColorPicker() {
    if (Boolean(this.#element) === false) return;
    if (this.#layout.showStatus === SimpleColorPickerConstant.SHOW) return;
    const value = this.#element.value;
    this.beforeOpenValue = value;
    this.#layout.setValue(value);
    this.#layout.show();
  }

  hideColorPicker() {
    if (Boolean(this.#element) === false) return;
    if (this.#layout.showStatus === SimpleColorPickerConstant.HIDE) return;
    const value = this.#layout.getValue();
    this.#element.value = value;
    this.#layout.hide();
  }

  #addFocusEvent = function () {
    this.#element.addEventListener(
      SimpleColorPickerConstant.EVENT_FOCUS,
      this.showColorPicker
    );
    this.#layout.addEventListener(
      SimpleColorPickerConstant.EVENT_INPUT,
      this.#executeElementEvent
    );
    this.#layout.addEventListener(
      SimpleColorPickerConstant.EVENT_CHANGE,
      this.#executeElementEvent
    );
    this.#layout.addEventListener(
      SimpleColorPickerConstant.EVENT_CLOSE,
      this.#executeElementEvent
    );
  };

  #removeFocusEvent = function () {
    this.#element.removeEventListener(
      SimpleColorPickerConstant.EVENT_FOCUS,
      this.showColorPicker
    );
    this.#layout.removeEventListener(
      SimpleColorPickerConstant.EVENT_INPUT,
      this.#executeElementEvent
    );
    this.#layout.removeEventListener(
      SimpleColorPickerConstant.EVENT_CHANGE,
      this.#executeElementEvent
    );
    this.#layout.removeEventListener(
      SimpleColorPickerConstant.EVENT_CLOSE,
      this.#executeElementEvent
    );
  };

  #executeElementEvent = function (type) {
    const event = new Event(type);

    switch (type) {
      case SimpleColorPickerConstant.EVENT_INPUT:
        if (Boolean(this.#element) === false) break;
        this.#element.value = this.#layout.getValue();
        this.#element.dispatchEvent(event);
        break;
      case SimpleColorPickerConstant.EVENT_CHANGE:
        if (Boolean(this.#element) === false) break;
        this.#element.value = this.#layout.getValue();
        this.#element.dispatchEvent(event);
        this.hideColorPicker();
        break;
      case SimpleColorPickerConstant.EVENT_CLOSE:
        this.#element.value = this.beforeOpenValue;
        this.#layout.setValue(this.beforeOpenValue);
        this.hideColorPicker();
        break;
    }
  };

  #getElement = function (element) {
    if (typeof element === "string") {
      return document.querySelector(element);
    } else if (element instanceof Element) {
      return element;
    } else {
      throw new TypeError("please input type string or element");
    }
  };
}

class SimpleColorPickerLayout {
  #element = null;
  #value = null;
  #listeners = {
    [SimpleColorPickerConstant.EVENT_INPUT]: [],
    [SimpleColorPickerConstant.EVENT_CHANGE]: [],
    [SimpleColorPickerConstant.EVENT_CLOSE]: [],
  };
  #showStatus = SimpleColorPickerConstant.HIDE;

  get showStatus() {
    return this.#showStatus;
  }

  constructor() {
    const template = document.createElement("template");
    template.innerHTML = `
    <div tabindex="0" style="position: fixed;">
      <!-- 테스트용임 -->
      <!-- canvas(혹은 svg)로 컬러피커 범위 만들고, alpha slider도 만들기 -->
      <!-- 컬러피커 범위는 맨위는 무지개색, 밑으로 갈수록 검정색 (내가 쓰는 jquery용 참고해보기) -->
      <input data-id="data" />
      <button data-id="${SimpleColorPickerConstant.COLOR_PICKER_CANCEL}">Cancel</button>
      <button data-id="${SimpleColorPickerConstant.COLOR_PICKER_CHANGE}">Change</button>
    </div>
    `;
    this.#element = template.content.children[0];
    this.#element.addEventListener(
      "click",
      function (e) {
        const target = e.target;
        const dataId = target.getAttribute("data-id");

        switch (dataId) {
          case SimpleColorPickerConstant.COLOR_PICKER_CANCEL:
            this.#excuteEvent(SimpleColorPickerConstant.EVENT_CLOSE);
            break;
          case SimpleColorPickerConstant.COLOR_PICKER_CHANGE:
            this.#excuteEvent(SimpleColorPickerConstant.EVENT_CHANGE);
            break;
        }
      }.bind(this)
    );
    // TODO: 테스트용임
    this.#element.addEventListener(
      "input",
      function (e) {
        const target = e.target;
        const dataId = target.getAttribute("data-id");

        switch (dataId) {
          case "data":
            this.setValue(target.value);
            break;
        }
      }.bind(this)
    );
  }

  show() {
    this.#showStatus = SimpleColorPickerConstant.SHOW;
    document.body.appendChild(this.#element);
    this.#element.focus();
  }
  hide() {
    this.#showStatus = SimpleColorPickerConstant.HIDE;
    this.#element.remove();
  }

  setValue(value) {
    this.#value = value;
    // TODO: value랑 element DOM이랑 동기화
  }
  getValue() {
    return this.#value;
  }

  addEventListener(type, fn) {
    if (Boolean(this.#listeners[type]) === false) return;
    this.#listeners[type].push(fn);
  }
  removeEventListener(type, fn) {
    if (Boolean(this.#listeners[type]) === false) return;
    const findIndex = this.#listeners[type].findIndex(function (f) {
      return f === fn;
    });
    this.#listeners[type].splice(findIndex, 1);
  }

  #excuteEvent = function (type) {
    if (Boolean(this.#listeners[type]) === false) return;
    this.#listeners[type].forEach(function (fn) {
      try {
        fn(type);
      } catch (error) {
        console.error(error);
      }
    });
  };
}

window.SimpleColorPicker = SimpleColorPicker;
