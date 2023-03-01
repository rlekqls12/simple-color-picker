(() => {
  // 상수
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

  // input element와 color-picker 팝업을 연결시켜주는 클래스 (데이터, 이벤트)
  class SCP {
    #element = null; // 입력 받는 엘리먼트
    #layout = new SCPLayout(); // color-picker 팝업 클래스
    options = {
      // color-picker 옵션
      transparency: true, // 투명도 조절바 표시
      immediateInput: true, // 선택 즉시 input 이벤트 발생
      showButtons: true, // 버튼 표시, true면 showChangeButton, showCancelButton 옵션도 true로 인식, false면 showChangeButton, showCancelButton에 따라 각각 표시
      showChangeButton: true, // Change 버튼 표시
      showCancelButton: true, // Cancel 버튼 표시
      outsideClickClose: false, // color-picker 팝업 외부 클릭시 팝업 닫기
      selectColorClose: false, // 색상 및 투명도 선택시 change 이벤트 발생 후 팝업 닫기
      showCompare: true, // 팝업을 열 때, 지정된 색상과 현재 선택된 색상을 비교하는 엘리먼트 표시
    };

    constructor(target, options) {
      this.show = this.show.bind(this);
      this.hide = this.hide.bind(this);
      this.#executeLayoutEvent = this.#executeLayoutEvent.bind(this);

      Object.assign(this.options, options || {});
      this.setElement(target);
    }

    // 기존 엘리먼트 연동 해제 및 입력 받는 엘리먼트 연동
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

    // 기존 엘리먼트 연동 해제
    disconnect() {
      if (this.#element === null) return;
      this.hide();
      delete this.#element.simpleColorPicker;
      this.#removeFocusEvent();
    }

    // color-picker 팝업 표시
    show() {
      if (Boolean(this.#element) === false) return;
      if (this.#layout.showStatus === SCPConstant.SHOW) return;
      const value = this.#element.value;
      this.#layout.setLayoutOptions(this.options);
      this.#layout.setCompareValue(value);
      this.#layout.setValue(value);
      this.#layout.show(this.#element);
    }

    // color-picker 팝업 닫기
    hide() {
      if (Boolean(this.#element) === false) return;
      if (this.#layout.showStatus === SCPConstant.HIDE) return;
      const value = this.#layout.getValue();
      this.#element.value = value;
      this.#layout.hide();
    }

    // 입력 받는 엘리먼트 및 color-picker 팝업에 이벤트 연결
    #addFocusEvent = function () {
      this.#element.addEventListener(SCPConstant.EVENT_FOCUS, this.show);
      this.#layout.addEventListener(SCPConstant.EVENT_INPUT, this.#executeLayoutEvent);
      this.#layout.addEventListener(SCPConstant.EVENT_CHANGE, this.#executeLayoutEvent);
      this.#layout.addEventListener(SCPConstant.EVENT_CLOSE, this.#executeLayoutEvent);
    };

    // 입력 받는 엘리먼트 및 color-picker 팝업에 이벤트 연결 해제
    #removeFocusEvent = function () {
      this.#element.removeEventListener(SCPConstant.EVENT_FOCUS, this.show);
      this.#layout.removeEventListener(SCPConstant.EVENT_INPUT, this.#executeLayoutEvent);
      this.#layout.removeEventListener(SCPConstant.EVENT_CHANGE, this.#executeLayoutEvent);
      this.#layout.removeEventListener(SCPConstant.EVENT_CLOSE, this.#executeLayoutEvent);
    };

    // color-picker에서 이벤트 발생시 특정 동작 실행
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

    // TODO: 개발 디버그용
    #syncElementVisible = function () {
      // TODO: DEBUG VISIBLE
      const target = this.#element;
      const colorValue = target.value;

      target.style.borderColor = colorValue;
    };

    // query-selector 및 element로 엘리먼트 조회
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

  // color-picker 팝업 클래스
  class SCPLayout {
    #element = null; // 팝업 엘리먼트
    #value = null; // 선택된 색상 값
    #listeners = {
      // 이벤트 발생시 실행시킬 함수 배열
      [SCPConstant.EVENT_INPUT]: [],
      [SCPConstant.EVENT_CHANGE]: [],
      [SCPConstant.EVENT_CLOSE]: [],
    };
    #showStatus = SCPConstant.HIDE; // 팝업 표시 상태
    #target = null; // 입력 받을 엘리먼트
    #compareValue = null; // 비교할 이전 색상 값
    options = {}; // color-picker 표시 옵션
    // 원색 색상 맵
    colorRateMap = [
      { rate: 0, color: [255, 0, 0] },
      { rate: 0.17, color: [255, 255, 0] },
      { rate: 0.33, color: [0, 255, 0] },
      { rate: 0.5, color: [0, 255, 255] },
      { rate: 0.67, color: [0, 0, 255] },
      { rate: 0.83, color: [255, 0, 255] },
      { rate: 1, color: [255, 0, 0] },
      { rate: 2, color: [255, 0, 0] },
    ];

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

    // 입력 받을 엘리먼트의 화면 위치에 따라 color-picker 팝업 위치 계산
    #getLayoutCoordinate() {
      const target = this.#target;
      const [targetLeft, targetTop, targetHeight] = [target.offsetLeft, target.offsetTop, target.offsetHeight];
      const [layoutWidth, layoutHeight] = [this.#element.offsetWidth, this.#element.offsetHeight];
      const [pageXMin, pageXMax, pageYMin] = [scrollX, scrollX + innerWidth, scrollY];

      let top = 0,
        left = 0;

      if (targetLeft < pageXMin) {
        left = pageXMin + layoutWidth * 0.04; // screen left
      } else if (targetLeft <= pageXMin + layoutWidth * 1.04) {
        left = targetLeft; // target left
      } else {
        left = pageXMax - layoutWidth * 1.08; // screen right
      }

      if (targetTop <= pageYMin + layoutHeight * 1.04) {
        top = targetTop + targetHeight + layoutHeight * 0.04; // target bottom
      } else {
        top = targetTop - layoutHeight * 1.08; // target top
      }

      return { top, left };
    }

    // color-picker 팝업 표시
    show(target) {
      this.#target = target;
      document.body.appendChild(this.#element);

      const { top, left } = this.#getLayoutCoordinate();
      this.#element.style.top = `${top}px`;
      this.#element.style.left = `${left}px`;

      this.#showStatus = SCPConstant.SHOW;
      target.focus();
      if (Element.prototype.scrollIntoViewIfNeeded) this.#element.scrollIntoViewIfNeeded();
      else this.#element.scrollIntoView();
      this.#calculateColorToPointer();
    }
    // color-picker 팝업 닫기
    hide() {
      this.#element.remove();
      this.#showStatus = SCPConstant.HIDE;
    }

    // 비교 할 색상 값 설정 및 엘리먼트에 표시
    setCompareValue(value) {
      this.#compareValue = value;

      if (this.options.showCompare === true) {
        const compareColor = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_COMPARE}"`);
        compareColor.style.borderTopColor = value;
        compareColor.style.borderLeftColor = value;
      }
    }
    // 비교 할 색상 값 조회
    getCompareValue() {
      return this.#compareValue;
    }

    // 선택한 색상 값 설정 및 엘리먼트에 표시
    setValue(value) {
      this.#value = value;

      if (this.options.showCompare === true) {
        const compareColor = this.#element.querySelector(`*[data-id="${SCPConstant.COLOR_PICKER_COMPARE}"`);
        compareColor.style.borderBottomColor = value;
        compareColor.style.borderRightColor = value;
      }
    }
    // 선택한 색상 값 조회
    getValue() {
      return this.#value;
    }

    // color-picker 팝업에 이벤트 연결
    addEventListener(type, fn) {
      if (Boolean(this.#listeners[type]) === false) return;
      this.#listeners[type].push(fn);
    }
    // color-picker 팝업에 이벤트 연결 해제
    removeEventListener(type, fn) {
      if (Boolean(this.#listeners[type]) === false) return;
      const findIndex = this.#listeners[type].findIndex(function (f) {
        return f === fn;
      });
      this.#listeners[type].splice(findIndex, 1);
    }

    // color-picker 팝업에 이벤트 실행
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

    // color-picker 팝업 초기화
    #initLayout = function () {
      const template = document.createElement("template");
      template.innerHTML = `
    <div style="position: absolute; margin: 4px; padding: 8px; box-shadow: 4px 4px 8px 1px rgb(0 0 0 / 20%); background: white;">
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
        <div data-id="${SCPConstant.COLOR_PICKER_COMPARE}" style="border: 10px solid; box-sizing: border-box; background-size: 7px; background-attachment: fixed;
            background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==);
            background-image: url(data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='%23ccc' fill-opacity='1'%3E%3Crect x='0' y='0' width='6' height='6' /%3E%3Crect x='6' y='6' width='6' height='6' /%3E%3C/svg%3E);"></div>
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
        mouseInfo.x = e.clientX;
        mouseInfo.y = e.clientY;

        if (mouseInfo.status !== SCPConstant.MOUSE_STATE_DOWN) return;
        this.#mouseEvent(mouseInfo);
      });
      elements.forEach((dataId) => {
        const element = this.#element.querySelector(`*[data-id="${dataId}"]`);
        element.addEventListener("mousedown", (e) => {
          mouseInfo.x = e.clientX;
          mouseInfo.y = e.clientY;
          mouseInfo.target = dataId;
          mouseInfo.status = SCPConstant.MOUSE_STATE_DOWN;
          this.#mouseEvent(mouseInfo);
        });
      });
    };

    // color-picker 팝업에서 Pointer 마우스 이벤트
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

    // 포인터 위치에 따른 색상 값 추출
    #calculatePointerToColor = function () {
      function getCoordinate(pointer) {
        const parent = pointer.parentNode;
        const parentCoordinate = parent.getBoundingClientRect();
        const pointerCoordinate = pointer.getBoundingClientRect();

        const pointerMaxX = parentCoordinate.width - pointer.offsetWidth / 2;
        const pointerMaxY = parentCoordinate.height - pointer.offsetHeight / 2;

        const pointerRelativeX = pointerCoordinate.x - parentCoordinate.x;
        const pointerRelativeY = pointerCoordinate.y - parentCoordinate.y;

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
        const originCoordinate = getCoordinate(originPointer);

        const endIndex = this.colorRateMap.findIndex((rateInfo) => originCoordinate.yRate < rateInfo.rate);
        const [colorStart, colorEnd] = this.colorRateMap.slice(endIndex - 1, endIndex + 1);
        const rate = (originCoordinate.yRate - colorStart.rate) / (colorEnd.rate - colorStart.rate);
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
        const colorCoordinate = getCoordinate(colorPointer);

        const xAxisRGB = originRGB.map((color) => {
          return color + (255 - color) * (1 - colorCoordinate.xRate);
        });

        const yAxisRGB = xAxisRGB.map((color) => {
          return color - color * colorCoordinate.yRate;
        });

        return yAxisRGB;
      })();

      // transparency
      const transparencyRGBA = (() => {
        if (this.options.transparency !== true) return [...colorRGB.map(Math.ceil), 1];

        const pointerDataId = SCPConstant.COLOR_PICKER_TRANSPARENCY_POINTER;
        const transparencyPointer = this.#element.querySelector(`*[data-id="${pointerDataId}"]`);
        const transparencyCoordinate = getCoordinate(transparencyPointer);

        const result = `linear-gradient(to bottom,rgba(${colorRGB.join(",")},1) 0,rgba(255,255,255,0) 100%)`;

        const dataId = SCPConstant.COLOR_PICKER_SELECT_TRANSPARENCY_COLOR;
        const transparencySelectColorRange = this.#element.querySelector(`*[data-id="${dataId}"]`);
        transparencySelectColorRange.style.background = result;

        const alpha = Math.floor((1 - transparencyCoordinate.yRate) * 100) / 100;
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

    // 색상 값에 따른 포인터 위치 추출
    #calculateColorToPointer = function () {
      function convertHexToNumber(hex) {
        return Number.parseInt(`0x${hex}`);
      }

      function decimalPlaces(number, digits = 1) {
        const pow = Math.pow(10, digits);
        return Math.floor(number * pow) / pow;
      }

      const value = this.getValue().toLowerCase().replace(/\s/g, "");
      let RGBA = [0, 0, 0, 1];

      // #RGB
      if (value.startsWith("#") && value.length === 4) {
        const regex = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
        const RGBAText = value.replace(regex, "$1,$2,$3");
        const RGBAValues = RGBAText.split(",").map(convertHexToNumber).map(decimalPlaces);
        Object.assign(RGBA, RGBAValues);
      }

      // #RRGGBB
      if (value.startsWith("#") && value.length === 7) {
        const regex = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;
        const RGBAText = value.replace(regex, "$1,$2,$3");
        const RGBAValues = RGBAText.split(",").map(convertHexToNumber).map(decimalPlaces);
        Object.assign(RGBA, RGBAValues);
      }

      // #ARGB
      if (value.startsWith("#") && value.length === 5) {
        const regex = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
        const RGBAText = value.replace(regex, "$1,$2,$3,$4");
        const RGBAValues = RGBAText.split(",").map(convertHexToNumber).map(decimalPlaces);
        const alpha = decimalPlaces(RGBAValues.shift() / 255);
        RGBAValues.push(alpha);
        Object.assign(RGBA, RGBAValues);
      }

      // #AARRGGBB
      if (value.startsWith("#") && value.length === 9) {
        const regex = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;
        const RGBAText = value.replace(regex, "$1,$2,$3,$4");
        const RGBAValues = RGBAText.split(",").map(convertHexToNumber).map(decimalPlaces);
        const alpha = decimalPlaces(RGBAValues.shift() / 255);
        RGBAValues.push(alpha);
        Object.assign(RGBA, RGBAValues);
      }

      // rgb(r,g,b)
      if (value.startsWith("rgb(")) {
        const regex = /^rgb\(([0-9.]+),([0-9.]+),([0-9.]+)\)$/;
        const RGBAText = value.replace(regex, "$1,$2,$3");
        const RGBAValues = RGBAText.split(",").map(decimalPlaces);
        Object.assign(RGBA, RGBAValues);
      }

      // rgba(r,g,b,a)
      if (value.startsWith("rgba(")) {
        const regex = /^rgba\(([0-9.]+),([0-9.]+),([0-9.]+),([0-9.]+)\)$/;
        const RGBAText = value.replace(regex, "$1,$2,$3,$4");
        const RGBAValues = RGBAText.split(",").map(decimalPlaces);
        Object.assign(RGBA, RGBAValues);
      }

      console.log("calculateColorToPointer", RGBA);

      // 값이 NaN이 있으면 오류 발생
      if (RGBA.some(isNaN)) throw new Error(`not allowed data type : ${value}`);

      // 투명도 포인터 위치 설정
      const transparencyPointerDataId = SCPConstant.COLOR_PICKER_TRANSPARENCY_POINTER;
      const transparencyPointer = this.#element.querySelector(`*[data-id="${transparencyPointerDataId}"]`);
      const transparencyPointerParent = transparencyPointer.parentNode;
      const transparencyPointerY =
        -transparencyPointer.offsetHeight / 2 + transparencyPointerParent.offsetHeight * (1 - RGBA[3]);
      transparencyPointer.style.top = `${transparencyPointerY}px`;

      const offsetColorRateMap = this.colorRateMap.map((colorRate) => ({
        rate: colorRate.rate,
        color: colorRate.color.map((color) => color / 255),
      }));

      // 원색 포인터 위치 설정
      const RGB = RGBA.slice(0, 3);
      const minColorValue = Math.min(...RGB);
      const originRGB = RGB.map((color) => color - minColorValue);
      const originColorRateMapIndex = Math.max(
        offsetColorRateMap.findIndex((colorRate) =>
          originRGB.every((origin, index) => {
            const rateColor = colorRate.color[index];
            return (origin === 0 && rateColor === 0) || (rateColor > 0 && origin > rateColor);
          })
        ),
        0
      );
      const originColorMap = this.colorRateMap[originColorRateMapIndex];
      const originColorNextMap = this.colorRateMap[originColorRateMapIndex + 1];
      console.log(originColorMap.color, originColorNextMap.color);
      const maxColorValue = Math.max(...originRGB);
      const originProgressList = originRGB
        .map((color) => {
          // 원색 값만 비교할 수 있게 값 정렬
          if (color === 0) return 0;
          return color + (255 - maxColorValue);
        })
        .map((color, index) => {
          // 다음 색상까지 진전율
          const nowColor = originColorMap.color[index];
          const nextColor = originColorNextMap.color[index];
          const molecule = nowColor - color;
          const denominator = nowColor - nextColor;
          if (molecule === 0 && denominator === 0) return -1;
          return molecule / denominator;
        })
        .filter((rate) => rate !== -1);
      const originProgressRate = decimalPlaces(
        1 - originProgressList.reduce((sum, rate) => sum + rate) / originProgressList.length,
        2
      );
      const originRate = originColorMap.rate + (originColorNextMap.rate - originColorMap.rate) * originProgressRate;
      // 원색 비율은 구했는데, 왼쪽 컬러 범위에서 움직이면 다시 흐트러짐
      const originPointerDataId = SCPConstant.COLOR_PICKER_ORIGIN_POINTER;
      const originPointer = this.#element.querySelector(`*[data-id="${originPointerDataId}"]`);
      const originPointerParent = originPointer.parentNode;
      const originPointerY = -originPointer.offsetHeight / 2 + originPointerParent.offsetHeight * originRate;
      originPointer.style.top = `${originPointerY}px`;

      // TODO: 색상 포인터 위치 설정

      // 포인터 위치에 따른 Range 색상 변경
      this.#calculatePointerToColor();
    };

    // color-picker 옵션 설정 및 적용
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

  // 글로벌로 사용할 수 있게 window에 변수 연결
  window.SimpleColorPicker = SCP;
})();
