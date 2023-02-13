class SimpleColorPickerConstant {
  static SHOW = "SHOW";
  static HIDE = "HIDE";

  // -------------------------------------------------------------------------------

  static COLOR_PICKER_COLOR_RANGE = "COLOR_PICKER_COLOR_RANGE";
  static COLOR_PICKER_SELECT_ORIGIN_COLOR = "COLOR_PICKER_SELECT_ORIGIN_COLOR";
  static COLOR_PICKER_COLOR_POINTER = "COLOR_PICKER_COLOR_POINTER";

  static COLOR_PICKER_ORIGIN_RANGE = "COLOR_PICKER_ORIGIN_RANGE";
  static COLOR_PICKER_ORIGIN_POINTER = "COLOR_PICKER_ORIGIN_POINTER";

  static COLOR_PICKER_TRANSPARENCY_RANGE = "COLOR_PICKER_TRANSPARENCY_RANGE";
  static COLOR_PICKER_SELECT_TRANSPARENCY_COLOR = "COLOR_PICKER_SELECT_TRANSPARENCY_COLOR";
  static COLOR_PICKER_TRANSPARENCY_POINTER = "COLOR_PICKER_TRANSPARENCY_POINTER";

  static COLOR_PICKER_CLICK_EVENT_RANGE = "COLOR_PICKER_CLICK_EVENT_RANGE";
  static COLOR_PICKER_CANCEL = "COLOR_PICKER_CANCEL";
  static COLOR_PICKER_CHANGE = "COLOR_PICKER_CHANGE";

  // -------------------------------------------------------------------------------

  static EVENT_FOCUS = "focus";
  static EVENT_INPUT = "input";
  static EVENT_CHANGE = "change";
  static EVENT_CLOSE = "close";

  // -------------------------------------------------------------------------------

  static MOUSE_STATE_UP = "MOUSE_STATE_UP";
  static MOUSE_STATE_DOWN = "MOUSE_STATE_DOWN";
}

class SimpleColorPicker {
  #element = null;
  #layout = new SimpleColorPickerLayout();
  beforeOpenValue = null;

  constructor(element) {
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.#executeLayoutEvent = this.#executeLayoutEvent.bind(this);

    this.setElement(element);
  }

  setElement(element) {
    if (this.#element) {
      this.hide();
      delete this.#element.simpleColorPicker;
      this.#removeFocusEvent();
    }

    this.#element = this.#getElement(element);
    this.#element.simpleColorPicker = this;
    this.#addFocusEvent();
  }

  show() {
    if (Boolean(this.#element) === false) return;
    if (this.#layout.showStatus === SimpleColorPickerConstant.SHOW) return;
    const value = this.#element.value;
    this.beforeOpenValue = value;
    this.#layout.setValue(value);
    this.#layout.show();
  }

  hide() {
    if (Boolean(this.#element) === false) return;
    if (this.#layout.showStatus === SimpleColorPickerConstant.HIDE) return;
    const value = this.#layout.getValue();
    this.#element.value = value;
    this.#layout.hide();
  }

  #addFocusEvent = function () {
    this.#element.addEventListener(SimpleColorPickerConstant.EVENT_FOCUS, this.show);
    this.#layout.addEventListener(SimpleColorPickerConstant.EVENT_INPUT, this.#executeLayoutEvent);
    this.#layout.addEventListener(SimpleColorPickerConstant.EVENT_CHANGE, this.#executeLayoutEvent);
    this.#layout.addEventListener(SimpleColorPickerConstant.EVENT_CLOSE, this.#executeLayoutEvent);
  };

  #removeFocusEvent = function () {
    this.#element.removeEventListener(SimpleColorPickerConstant.EVENT_FOCUS, this.show);
    this.#layout.removeEventListener(SimpleColorPickerConstant.EVENT_INPUT, this.#executeLayoutEvent);
    this.#layout.removeEventListener(SimpleColorPickerConstant.EVENT_CHANGE, this.#executeLayoutEvent);
    this.#layout.removeEventListener(SimpleColorPickerConstant.EVENT_CLOSE, this.#executeLayoutEvent);
  };

  #executeLayoutEvent = function (type) {
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
        this.hide();
        break;
      case SimpleColorPickerConstant.EVENT_CLOSE:
        this.#element.value = this.beforeOpenValue;
        this.#layout.setValue(this.beforeOpenValue);
        this.hide();
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
    this.#initLayout();
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
    // TODO: value랑 Pointer 위치랑 동기화
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

  #initLayout = function () {
    const template = document.createElement("template");
    template.innerHTML = `
    <div tabindex="0" style="position: fixed; margin: 4px; padding: 8px; border: 2px solid black; background: white;">
      <div style="display: flex; flex-direction: row; gap: 8px;">
        <div style="position: relative; width: 160px; height: 160px; border-radius: 4px; user-select: none;">
          <div data-id="${SimpleColorPickerConstant.COLOR_PICKER_SELECT_ORIGIN_COLOR}" style="position: absolute; width: 100%; height: 100%; border-radius: 4px; background: rgb(255,0,0);"></div>
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 4px; background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);"></div>
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 4px; background: linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);"></div>
          <div data-id="${SimpleColorPickerConstant.COLOR_PICKER_COLOR_RANGE}" style="position: absolute; width: 100%; height: 100%;"></div>
          <div data-id="${SimpleColorPickerConstant.COLOR_PICKER_COLOR_POINTER}" style="position: absolute; top: -5px; left: -5px; width: 10px; height: 10px; border: 1px solid white; border-radius: 4px; box-sizing: border-box; box-shadow: 0 0 2px 1px rgb(0 0 0 / 20%); cursor: pointer;"></div>
        </div>
        <div style="position: relative; width: 16px; height: 160px; border-radius: 4px; user-select: none;">
          <div style="position: absolute; width: 100%; height: 160px; border-radius: 4px; background: linear-gradient(to bottom,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%);"></div>
          <div data-id="${SimpleColorPickerConstant.COLOR_PICKER_ORIGIN_RANGE}" style="position: absolute; width: 100%; height: 100%;"></div>
          <div data-id="${SimpleColorPickerConstant.COLOR_PICKER_ORIGIN_POINTER}" style="position: absolute; top: -4px; width: 100%; height: 8px; border-radius: 2px; background: white; box-shadow: 0 0 2px 1px rgb(0 0 0 / 20%); cursor: pointer;"></div>
        </div>
        <div style="position: relative; width: 16px; height: 160px; border-radius: 4px; user-select: none;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 4px;
                      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==);
                      background-image: url(data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='%23ccc' fill-opacity='1'%3E%3Crect x='0' y='0' width='6' height='6' /%3E%3Crect x='6' y='6' width='6' height='6' /%3E%3C/svg%3E);"></div>
          <div data-id="${SimpleColorPickerConstant.COLOR_PICKER_SELECT_TRANSPARENCY_COLOR}" style="position: absolute; width: 100%; height: 100%; border-radius: 4px; background: linear-gradient(to bottom,red 0,rgba(255,255,255,0) 100%);"></div>
          <div data-id="${SimpleColorPickerConstant.COLOR_PICKER_TRANSPARENCY_RANGE}" style="position: absolute; width: 100%; height: 100%;"></div>
          <div data-id="${SimpleColorPickerConstant.COLOR_PICKER_TRANSPARENCY_POINTER}" style="position: absolute; top: -4px; width: 100%; height: 8px; border-radius: 2px; background: white; box-shadow: 0 0 2px 1px rgb(0 0 0 / 20%); cursor: pointer;"></div>
        </div>
      </div>
      <div data-id="${SimpleColorPickerConstant.COLOR_PICKER_CLICK_EVENT_RANGE}" style="width: 100%; margin-top: 8px; text-align: right;">
        <button data-id="${SimpleColorPickerConstant.COLOR_PICKER_CANCEL}" style="cursor: pointer;">Cancel</button>
        <button data-id="${SimpleColorPickerConstant.COLOR_PICKER_CHANGE}" style="cursor: pointer;">Change</button>
      </div>
    </div>
    `;
    this.#element = template.content.children[0];

    // event - click
    const clickEventRangeId = SimpleColorPickerConstant.COLOR_PICKER_CLICK_EVENT_RANGE;
    const clickElement = this.#element.querySelector(`*[data-id="${clickEventRangeId}"]`);
    clickElement.addEventListener(
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

    // event - mouseup / down / move
    const mouseInfo = {};
    const elements = [
      SimpleColorPickerConstant.COLOR_PICKER_COLOR_RANGE,
      SimpleColorPickerConstant.COLOR_PICKER_ORIGIN_RANGE,
      SimpleColorPickerConstant.COLOR_PICKER_TRANSPARENCY_RANGE,
      SimpleColorPickerConstant.COLOR_PICKER_COLOR_POINTER,
      SimpleColorPickerConstant.COLOR_PICKER_ORIGIN_POINTER,
      SimpleColorPickerConstant.COLOR_PICKER_TRANSPARENCY_POINTER,
    ];
    window.addEventListener("mouseup", () => {
      mouseInfo.target = null;
      mouseInfo.status = SimpleColorPickerConstant.MOUSE_STATE_UP;
    });
    window.addEventListener("mousemove", (e) => {
      if (mouseInfo.target === null) return;
      mouseInfo.x = e.pageX;
      mouseInfo.y = e.pageY;

      if (mouseInfo.status !== SimpleColorPickerConstant.MOUSE_STATE_DOWN) return;
      this.#mouseEvent(mouseInfo);
    });
    elements.forEach((dataId) => {
      const element = this.#element.querySelector(`*[data-id="${dataId}"]`);
      element.addEventListener("mousedown", (e) => {
        mouseInfo.x = e.pageX;
        mouseInfo.y = e.pageY;
        mouseInfo.target = dataId;
        mouseInfo.status = SimpleColorPickerConstant.MOUSE_STATE_DOWN;
        this.#mouseEvent(mouseInfo);
      });
    });
  };

  #mouseEvent = function ({ target, x, y }) {
    let rangeId, pointerId;
    switch (target) {
      case SimpleColorPickerConstant.COLOR_PICKER_COLOR_RANGE:
      case SimpleColorPickerConstant.COLOR_PICKER_COLOR_POINTER:
        rangeId = SimpleColorPickerConstant.COLOR_PICKER_COLOR_RANGE;
        pointerId = SimpleColorPickerConstant.COLOR_PICKER_COLOR_POINTER;
        break;
      case SimpleColorPickerConstant.COLOR_PICKER_ORIGIN_RANGE:
      case SimpleColorPickerConstant.COLOR_PICKER_ORIGIN_POINTER:
        rangeId = SimpleColorPickerConstant.COLOR_PICKER_ORIGIN_RANGE;
        pointerId = SimpleColorPickerConstant.COLOR_PICKER_ORIGIN_POINTER;
        x = null;
        break;
      case SimpleColorPickerConstant.COLOR_PICKER_TRANSPARENCY_RANGE:
      case SimpleColorPickerConstant.COLOR_PICKER_TRANSPARENCY_POINTER:
        rangeId = SimpleColorPickerConstant.COLOR_PICKER_TRANSPARENCY_RANGE;
        pointerId = SimpleColorPickerConstant.COLOR_PICKER_TRANSPARENCY_POINTER;
        x = null;
        break;
    }

    if (rangeId && pointerId) {
      const pointer = this.#element.querySelector(`*[data-id="${pointerId}"]`);
      const range = this.#element.querySelector(`*[data-id="${rangeId}"]`);
      const rangeRect = range.getBoundingClientRect();

      if (x !== null) {
        const pointerHalf = pointer.offsetWidth / 2;
        x = Math.min(Math.max(x - (rangeRect.x + pointerHalf), -pointerHalf), rangeRect.width - pointerHalf);
        pointer.style.left = `${x}px`;
      }
      if (y !== null) {
        const pointerHalf = pointer.offsetHeight / 2;
        y = Math.min(Math.max(y - (rangeRect.y + pointerHalf), -pointerHalf), rangeRect.height - pointerHalf);
        pointer.style.top = `${y}px`;
      }
    }
  };
}

window.SimpleColorPicker = SimpleColorPicker;
