(() => {
  const SCPConstant = Object.freeze({
    SHOW: "SHOW",
    HIDE: "HIDE",

    // -------------------------------------------------------------------------------

    COLOR_PICKER_COLOR_RANGE: "COLOR_PICKER_COLOR_RANGE",
    COLOR_PICKER_SELECT_ORIGIN_COLOR: "COLOR_PICKER_SELECT_ORIGIN_COLOR",
    COLOR_PICKER_COLOR_POINTER: "COLOR_PICKER_COLOR_POINTER",

    COLOR_PICKER_ORIGIN_RANGE: "COLOR_PICKER_ORIGIN_RANGE",
    COLOR_PICKER_ORIGIN_POINTER: "COLOR_PICKER_ORIGIN_POINTER",

    COLOR_PICKER_TRANSPARENCY_WRAP: "COLOR_PICKER_TRANSPARENCY_WRAP",
    COLOR_PICKER_TRANSPARENCY_RANGE: "COLOR_PICKER_TRANSPARENCY_RANGE",
    COLOR_PICKER_SELECT_TRANSPARENCY_COLOR: "COLOR_PICKER_SELECT_TRANSPARENCY_COLOR",
    COLOR_PICKER_TRANSPARENCY_POINTER: "COLOR_PICKER_TRANSPARENCY_POINTER",

    COLOR_PICKER_COMPARE: "COLOR_PICKER_COMPARE",

    COLOR_PICKER_CLICK_EVENT_RANGE: "COLOR_PICKER_CLICK_EVENT_RANGE",
    COLOR_PICKER_CANCEL: "COLOR_PICKER_CANCEL",
    COLOR_PICKER_CHANGE: "COLOR_PICKER_CHANGE",

    // -------------------------------------------------------------------------------

    EVENT_FOCUS: "focus",
    EVENT_INPUT: "input",
    EVENT_CHANGE: "change",
    EVENT_CLOSE: "close",

    // -------------------------------------------------------------------------------

    MOUSE_STATE_UP: "MOUSE_STATE_UP",
    MOUSE_STATE_DOWN: "MOUSE_STATE_DOWN",
  });

  class SCP {
    #element = null;
    #layout = new SCPLayout();
    options = {
      transparency: true,
      immediateInput: true,
      showButtons: true, // this true -> showChangeButton, showCancelButton true
      showChangeButton: true,
      showCancelButton: true,
      outsideClickClose: false,
      selectColorClose: false,
      showCompare: true,
    };

    constructor(target, options) {
      this.show = this.show.bind(this);
      this.hide = this.hide.bind(this);
      this.#executeLayoutEvent = this.#executeLayoutEvent.bind(this);

      Object.assign(this.options, options || {});
      this.setElement(target);
    }

    setElement(target) {
      this.disconnect();

      const element = this.#getElement(target);
      if (element.simpleColorPicker) {
        element.simpleColorPicker.hide && element.simpleColorPicker.hide();
        element.simpleColorPicker.disconnect && element.simpleColorPicker.disconnect();
      }

      this.#element = element;
      this.#element.simpleColorPicker = this;
      this.#syncElementVisible();
      this.#addFocusEvent();
    }

    disconnect() {
      if (this.#element === null) return;
      this.hide();
      delete this.#element.simpleColorPicker;
      this.#removeFocusEvent();
    }

    show() {
      if (Boolean(this.#element) === false) return;
      if (this.#layout.showStatus === SCPConstant.SHOW) return;
      const value = this.#element.value;
      this.#layout.setLayoutOptions(this.options);
      this.#layout.setCompareValue(value);
      this.#layout.setValue(value);
      this.#layout.show(this.#element);
    }

    hide() {
      if (Boolean(this.#element) === false) return;
      if (this.#layout.showStatus === SCPConstant.HIDE) return;
      const value = this.#layout.getValue();
      this.#element.value = value;
      this.#layout.hide();
    }

    #addFocusEvent = function () {
      this.#element.addEventListener(SCPConstant.EVENT_FOCUS, this.show);
      this.#layout.addEventListener(SCPConstant.EVENT_INPUT, this.#executeLayoutEvent);
      this.#layout.addEventListener(SCPConstant.EVENT_CHANGE, this.#executeLayoutEvent);
      this.#layout.addEventListener(SCPConstant.EVENT_CLOSE, this.#executeLayoutEvent);
    };

    #removeFocusEvent = function () {
      this.#element.removeEventListener(SCPConstant.EVENT_FOCUS, this.show);
      this.#layout.removeEventListener(SCPConstant.EVENT_INPUT, this.#executeLayoutEvent);
      this.#layout.removeEventListener(SCPConstant.EVENT_CHANGE, this.#executeLayoutEvent);
      this.#layout.removeEventListener(SCPConstant.EVENT_CLOSE, this.#executeLayoutEvent);
    };

    #executeLayoutEvent = function (type) {
      const event = new Event(type);

      switch (type) {
        case SCPConstant.EVENT_INPUT:
          if (Boolean(this.#element) === false) break;
          this.#element.value = this.#layout.getValue();
          this.#element.dispatchEvent(event);
          this.#syncElementVisible();
          break;
        case SCPConstant.EVENT_CHANGE:
          if (Boolean(this.#element) === false) break;
          this.#element.value = this.#layout.getValue();
          this.#element.dispatchEvent(event);
          this.hide();
          this.#syncElementVisible();
          break;
        case SCPConstant.EVENT_CLOSE:
          const compareValue = this.#layout.getCompareValue();
          this.#element.value = compareValue;
          this.#layout.setValue(compareValue);
          this.hide();
          this.#syncElementVisible();
          break;
      }
    };

    #syncElementVisible = function () {
      // TODO: DEBUG VISIBLE
      const target = this.#element;
      const colorValue = target.value;

      target.style.borderColor = colorValue;
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

  class SCPLayout {
    #element = null;
    #value = null;
    #listeners = {
      [SCPConstant.EVENT_INPUT]: [],
      [SCPConstant.EVENT_CHANGE]: [],
      [SCPConstant.EVENT_CLOSE]: [],
    };
    #showStatus = SCPConstant.HIDE;
    #target = null;
    #compareValue = null;
    options = {};

    get showStatus() {
      return this.#showStatus;
    }

    constructor() {
      this.#initLayout();

      // outsideClickClose
      window.addEventListener("click", (e) => {
        if (this.#showStatus === SCPConstant.HIDE) return;
        if (this.options.outsideClickClose !== true) return;

        const layout = this.#element;
        const parents = [document, document.body, layout];
        let target = e.target;

        while (parents.includes(target) === false) {
          if (target === this.#target) return;

          target = target.parentNode;
        }

        if (target !== layout) {
          this.#excuteEvent(SCPConstant.EVENT_CLOSE);
        }
      });
    }

    show(target) {
      this.#target = target;
      this.#showStatus = SCPConstant.SHOW;
      document.body.appendChild(this.#element);
      this.#element.focus();
    }
    hide() {
      this.#showStatus = SCPConstant.HIDE;
      this.#element.remove();
    }

    setCompareValue(value) {
      this.#compareValue = value;

      if (this.options.showCompare === true) {
        const compareColor = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_COMPARE}"`);
        compareColor.style.borderTopColor = value;
        compareColor.style.borderLeftColor = value;
      }
    }
    getCompareValue() {
      return this.#compareValue;
    }

    setValue(value) {
      this.#value = value;
      this.#calculateColorToPointer();

      if (this.options.showCompare === true) {
        const compareColor = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_COMPARE}"`);
        compareColor.style.borderBottomColor = value;
        compareColor.style.borderRightColor = value;
      }
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
    <div style="position: fixed; margin: 4px; padding: 8px; box-shadow: 4px 4px 8px 1px rgb(0 0 0 / 20%); background: white;">
      <div style="display: flex; flex-direction: row; gap: 8px;">
        <div style="position: relative; width: 200px; height: 160px; border-radius: 4px; user-select: none;">
          <div data-id="${SCPConstant.COLOR_PICKER_SELECT_ORIGIN_COLOR}" style="position: absolute; width: 100%; height: 100%; border-radius: 4px; background: rgb(255,0,0);"></div>
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 4px; background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);"></div>
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 4px; background: linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);"></div>
          <div data-id="${SCPConstant.COLOR_PICKER_COLOR_RANGE}" style="position: absolute; width: 100%; height: 100%;"></div>
          <div data-id="${SCPConstant.COLOR_PICKER_COLOR_POINTER}" style="position: absolute; top: -5px; left: 195px; width: 10px; height: 10px; border: 1px solid white; border-radius: 4px; box-sizing: border-box; box-shadow: 0 0 2px 1px rgb(0 0 0 / 20%); cursor: pointer;"></div>
        </div>
        <div style="position: relative; width: 16px; height: 160px; border-radius: 4px; user-select: none;">
          <div style="position: absolute; width: 100%; height: 160px; border-radius: 4px; background: linear-gradient(to bottom,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%);"></div>
          <div data-id="${SCPConstant.COLOR_PICKER_ORIGIN_RANGE}" style="position: absolute; width: 100%; height: 100%;"></div>
          <div data-id="${SCPConstant.COLOR_PICKER_ORIGIN_POINTER}" style="position: absolute; top: -4px; width: 100%; height: 8px; border-radius: 2px; background: white; box-shadow: 0 0 2px 1px rgb(0 0 0 / 20%); cursor: pointer;"></div>
        </div>
        <div data-id="${SCPConstant.COLOR_PICKER_TRANSPARENCY_WRAP}" style="position: relative; width: 16px; height: 160px; border-radius: 4px; user-select: none;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 4px;
                      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==);
                      background-image: url(data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='%23ccc' fill-opacity='1'%3E%3Crect x='0' y='0' width='6' height='6' /%3E%3Crect x='6' y='6' width='6' height='6' /%3E%3C/svg%3E);"></div>
          <div data-id="${SCPConstant.COLOR_PICKER_SELECT_TRANSPARENCY_COLOR}" style="position: absolute; width: 100%; height: 100%; border-radius: 4px; background: linear-gradient(to bottom,red 0,rgba(255,255,255,0) 100%);"></div>
          <div data-id="${SCPConstant.COLOR_PICKER_TRANSPARENCY_RANGE}" style="position: absolute; width: 100%; height: 100%;"></div>
          <div data-id="${SCPConstant.COLOR_PICKER_TRANSPARENCY_POINTER}" style="position: absolute; top: -4px; width: 100%; height: 8px; border-radius: 2px; background: white; box-shadow: 0 0 2px 1px rgb(0 0 0 / 20%); cursor: pointer;"></div>
        </div>
      </div>
      <div style="display: flex; align-items: center; width: 100%; margin-top: 8px;">
        <div data-id="${SCPConstant.COLOR_PICKER_COMPARE}" style="border: 10px solid; box-sizing: border-box;"></div>
        <div data-id="${SCPConstant.COLOR_PICKER_CLICK_EVENT_RANGE}" style="flex: 1; text-align: right;">
          <button data-id="${SCPConstant.COLOR_PICKER_CANCEL}" style="cursor: pointer;">Cancel</button>
          <button data-id="${SCPConstant.COLOR_PICKER_CHANGE}" style="cursor: pointer;">Change</button>
        </div>
      </div>
    </div>
    `;
      this.#element = template.content.children[0];

      // event - click
      const clickEventRangeId = SCPConstant.COLOR_PICKER_CLICK_EVENT_RANGE;
      const clickElement = this.#element.querySelector(`*[data-id="${clickEventRangeId}"]`);
      clickElement.addEventListener(
        "click",
        function (e) {
          const target = e.target;
          const dataId = target.getAttribute("data-id");

          switch (dataId) {
            case SCPConstant.COLOR_PICKER_CANCEL:
              this.#excuteEvent(SCPConstant.EVENT_CLOSE);
              break;
            case SCPConstant.COLOR_PICKER_CHANGE:
              this.#excuteEvent(SCPConstant.EVENT_CHANGE);
              break;
          }
        }.bind(this)
      );

      // event - mouseup / down / move
      const mouseInfo = {};
      const elements = [
        SCPConstant.COLOR_PICKER_COLOR_RANGE,
        SCPConstant.COLOR_PICKER_ORIGIN_RANGE,
        SCPConstant.COLOR_PICKER_TRANSPARENCY_RANGE,
        SCPConstant.COLOR_PICKER_COLOR_POINTER,
        SCPConstant.COLOR_PICKER_ORIGIN_POINTER,
        SCPConstant.COLOR_PICKER_TRANSPARENCY_POINTER,
      ];
      window.addEventListener("mouseup", () => {
        if (
          mouseInfo.target !== null &&
          this.options.selectColorClose === true &&
          mouseInfo.target !== SCPConstant.COLOR_PICKER_ORIGIN_POINTER
        ) {
          this.#excuteEvent(SCPConstant.EVENT_CHANGE);
        }
        mouseInfo.target = null;
        mouseInfo.status = SCPConstant.MOUSE_STATE_UP;
      });
      window.addEventListener("mousemove", (e) => {
        if (mouseInfo.target === null) return;
        mouseInfo.x = e.pageX;
        mouseInfo.y = e.pageY;

        if (mouseInfo.status !== SCPConstant.MOUSE_STATE_DOWN) return;
        this.#mouseEvent(mouseInfo);
      });
      elements.forEach((dataId) => {
        const element = this.#element.querySelector(`*[data-id="${dataId}"]`);
        element.addEventListener("mousedown", (e) => {
          mouseInfo.x = e.pageX;
          mouseInfo.y = e.pageY;
          mouseInfo.target = dataId;
          mouseInfo.status = SCPConstant.MOUSE_STATE_DOWN;
          this.#mouseEvent(mouseInfo);
        });
      });
    };

    #mouseEvent = function ({ target, x, y }) {
      let rangeId, pointerId;
      switch (target) {
        case SCPConstant.COLOR_PICKER_COLOR_RANGE:
        case SCPConstant.COLOR_PICKER_COLOR_POINTER:
          rangeId = SCPConstant.COLOR_PICKER_COLOR_RANGE;
          pointerId = SCPConstant.COLOR_PICKER_COLOR_POINTER;
          break;
        case SCPConstant.COLOR_PICKER_ORIGIN_RANGE:
        case SCPConstant.COLOR_PICKER_ORIGIN_POINTER:
          rangeId = SCPConstant.COLOR_PICKER_ORIGIN_RANGE;
          pointerId = SCPConstant.COLOR_PICKER_ORIGIN_POINTER;
          x = null;
          break;
        case SCPConstant.COLOR_PICKER_TRANSPARENCY_RANGE:
        case SCPConstant.COLOR_PICKER_TRANSPARENCY_POINTER:
          rangeId = SCPConstant.COLOR_PICKER_TRANSPARENCY_RANGE;
          pointerId = SCPConstant.COLOR_PICKER_TRANSPARENCY_POINTER;
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

        if (x !== null || y !== null) {
          const color = this.#calculatePointerToColor();
          this.setValue(color);

          if (this.options.immediateInput === true) {
            this.#excuteEvent(SCPConstant.EVENT_INPUT);
          }
        }
      }
    };

    #calculatePointerToColor = function () {
      function getMatrix(pointer) {
        const parent = pointer.parentNode;
        const parentMatrix = parent.getBoundingClientRect();
        const pointerMatrix = pointer.getBoundingClientRect();

        const pointerMaxX = parentMatrix.width - pointer.offsetWidth / 2;
        const pointerMaxY = parentMatrix.height - pointer.offsetHeight / 2;

        const pointerRelativeX = pointerMatrix.x - parentMatrix.x;
        const pointerRelativeY = pointerMatrix.y - parentMatrix.y;

        const pointerX = Math.min(Math.max(0, pointerRelativeX), pointerMaxX);
        const pointerY = Math.min(Math.max(0, pointerRelativeY), pointerMaxY);

        return {
          xRate: Math.round((pointerX / pointerMaxX) * 100) / 100,
          yRate: Math.round((pointerY / pointerMaxY) * 100) / 100,
        };
      }

      // origin
      const originRGB = (() => {
        const pointerDataId = SCPConstant.COLOR_PICKER_ORIGIN_POINTER;
        const originPointer = this.#element.querySelector(`*[data-id="${pointerDataId}"]`);
        const originMatrix = getMatrix(originPointer);

        const colorRateMap = [
          { rate: 0, color: [255, 0, 0] },
          { rate: 0.17, color: [255, 255, 0] },
          { rate: 0.33, color: [0, 255, 0] },
          { rate: 0.5, color: [0, 255, 255] },
          { rate: 0.67, color: [0, 0, 255] },
          { rate: 0.83, color: [255, 0, 255] },
          { rate: 1, color: [255, 0, 0] },
          { rate: 2, color: [255, 0, 0] },
        ];
        const endIndex = colorRateMap.findIndex((rateInfo) => originMatrix.yRate < rateInfo.rate);
        const [colorStart, colorEnd] = colorRateMap.slice(endIndex - 1, endIndex + 1);
        const rate = (originMatrix.yRate - colorStart.rate) / (colorEnd.rate - colorStart.rate);
        const originRGB = colorEnd.color.map((next, colorIndex) => {
          const base = colorStart.color[colorIndex];
          return base + (next - base) * rate;
        });
        const result = "rgb(" + originRGB.join(",") + ")";

        const dataId = SCPConstant.COLOR_PICKER_SELECT_ORIGIN_COLOR;
        const originSelectColorRange = this.#element.querySelector(`*[data-id="${dataId}"]`);
        originSelectColorRange.style.background = result;
        return originRGB;
      })();

      // color
      const colorRGB = (() => {
        const pointerDataId = SCPConstant.COLOR_PICKER_COLOR_POINTER;
        const colorPointer = this.#element.querySelector(`*[data-id="${pointerDataId}"]`);
        const colorMatrix = getMatrix(colorPointer);

        const xAxisRGB = originRGB.map((color) => {
          return color + (255 - color) * (1 - colorMatrix.xRate);
        });

        const yAxisRGB = xAxisRGB.map((color) => {
          return color - color * colorMatrix.yRate;
        });

        return yAxisRGB;
      })();

      // transparency
      const transparencyRGBA = (() => {
        if (this.options.transparency !== true) return [...colorRGB.map(Math.ceil), 1];

        const pointerDataId = SCPConstant.COLOR_PICKER_TRANSPARENCY_POINTER;
        const transparencyPointer = this.#element.querySelector(`*[data-id="${pointerDataId}"]`);
        const transparencyMatrix = getMatrix(transparencyPointer);

        const result = `linear-gradient(to bottom,rgba(${colorRGB.join(",")},1) 0,rgba(255,255,255,0) 100%)`;

        const dataId = SCPConstant.COLOR_PICKER_SELECT_TRANSPARENCY_COLOR;
        const transparencySelectColorRange = this.#element.querySelector(`*[data-id="${dataId}"]`);
        transparencySelectColorRange.style.background = result;

        const alpha = Math.floor((1 - transparencyMatrix.yRate) * 100) / 100;
        return [...colorRGB.map(Math.ceil), alpha];
      })();

      const alpha = transparencyRGBA[3];
      if (alpha === 1) {
        return (
          "#" +
          transparencyRGBA
            .slice(0, 3)
            .map((v) => v.toString(16).padStart(2, "0"))
            .join("")
        );
      } else {
        return `rgba(${transparencyRGBA.join(",")})`;
      }
    };

    #calculateColorToPointer = function () {};

    setLayoutOptions(options) {
      this.options = options;

      // transparency
      const transparencyWrap = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_TRANSPARENCY_WRAP}"`);
      transparencyWrap.style.display = options.transparency === true ? null : "none";

      // showButtons / showChangeButton / showCancelButton
      if (options.showButtons === true) {
        const buttonWrap = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_CLICK_EVENT_RANGE}"`);
        const changeButton = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_CHANGE}"`);
        const cancelButton = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_CANCEL}"`);
        buttonWrap.style.display = null;
        changeButton.style.display = null;
        cancelButton.style.display = null;
      } else {
        const buttonWrap = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_CLICK_EVENT_RANGE}"`);
        const changeButton = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_CHANGE}"`);
        const cancelButton = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_CANCEL}"`);
        buttonWrap.style.display =
          options.showChangeButton === true || options.showCancelButton === true ? null : "none";
        changeButton.style.display = options.showChangeButton === true ? null : "none";
        cancelButton.style.display = options.showCancelButton === true ? null : "none";
      }

      // showCompare
      const compareColor = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_COMPARE}"`);
      compareColor.style.display = options.showCompare === true ? null : "none";
    }
  }

  window.SimpleColorPicker = SCP;
})();
