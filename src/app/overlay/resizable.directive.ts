import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';

export enum ResizableState {
  Resizable,
  Selected,
  Resizing
}

export enum ResizableBorder {
  Top,
  Left,
  Right,
  Bottom,
  None
}

@Directive({
  selector: '[appResizable]'
})
export class ResizableDirective implements OnInit, AfterViewInit {
  resizableState: ResizableState = ResizableState.Resizable;
  selectedBorder: ResizableBorder = ResizableBorder.None;
  parentElementRef: any = null;
  activeConfiguration: any = {};
  hostNativeElementRef: any;
  hostNativeElementPosition: any = {};
  hostNativeElementRect: any = {};
  hostNativeElementParentRect: any = {};

  @Input('appResizable') resizableOptions: any;
  @Output() onStateChanged = new EventEmitter<ResizableState>();
  @Output() onResize = new EventEmitter<any>();

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) { }

  ngOnInit(): void {
    this.viewContainer.createEmbeddedView(this.templateRef);
  }

  ngAfterViewInit() {
    this.initiate();
  }

  changeState(newResizableState: ResizableState) {
    switch (this.resizableState) {
      case ResizableState.Resizable:
        if (newResizableState === ResizableState.Selected) {
            this.applyStyles(newResizableState);
        }
        break;
      case ResizableState.Selected:
        switch (newResizableState) {
          case ResizableState.Resizable:
            this.applyStyles(newResizableState);
            this.selectedBorder = ResizableBorder.None;
            break;
          case ResizableState.Resizing:
            this.applyStyles(newResizableState);
            break;
        }
        break;
      case ResizableState.Resizing:
        switch (newResizableState) {
          case ResizableState.Selected:
            this.applyStyles(newResizableState);
            break;
          case ResizableState.Resizable:
            this.applyStyles(newResizableState);
            this.selectedBorder = ResizableBorder.None;
            break;
        }
        break;
    }
    this.resizableState = newResizableState;
    this.onStateChanged.emit(newResizableState);
  }

  checkBorder(mouseEvent): ResizableBorder {
    const rect = this.hostNativeElementRect;
    if (this.activeConfiguration.top && (Math.abs(rect.y - mouseEvent.y) <= 10)) {
      return ResizableBorder.Top;
    }
    if (this.activeConfiguration.left && (Math.abs(rect.x - mouseEvent.x) <= 10)) {
      return ResizableBorder.Left;
    }
    if (this.activeConfiguration.right && (Math.abs(rect.x + rect.width - mouseEvent.x) <= 10)) {
      return ResizableBorder.Right;
    }
    if (this.activeConfiguration.bottom && (Math.abs(rect.y + rect.height - mouseEvent.y) <= 10)) {
      return ResizableBorder.Bottom;
    }
    return ResizableBorder.None;
  }

  mouseEventHandler(mouseEvent) {
    mouseEvent.preventDefault();
    if (mouseEvent.type === 'mouseenter') {
      this.capturePosition();
    }

    switch (this.resizableState) {
      case ResizableState.Resizable:
        switch (mouseEvent.type) {
          case 'mousemove':
          case 'mouseenter':
          case 'mouseleave':
            this.selectedBorder = this.checkBorder(mouseEvent);
            if (this.selectedBorder !== ResizableBorder.None) {
              this.changeState(ResizableState.Selected);
            }
            break;
        }
        break;
      case ResizableState.Selected:
        switch (mouseEvent.type) {
          case 'mouseleave':
            this.changeState(ResizableState.Resizable);
            break;
          case 'mousemove':
          case 'mouseenter':
            if (this.checkBorder(mouseEvent) !== this.selectedBorder) {
              this.changeState(ResizableState.Resizable);
            }
            break;
          case 'mousedown':
            this.changeState(ResizableState.Resizing);
            break;
        }
        break;
    }
  }

  checkWidthPx(newWidth, mouseEvent): boolean {
    return (!this.activeConfiguration.maxWidthPx || newWidth <= this.activeConfiguration.maxWidthPx)
      && (!this.activeConfiguration.parentWidthLimit || (this.hostNativeElementParentRect.x <= mouseEvent.x
        && mouseEvent.x <= this.hostNativeElementParentRect.x + this.hostNativeElementParentRect.width));
  }

  checkHeightPx(newHeight, mouseEvent): boolean {
    return (!this.activeConfiguration.maxHeightPx || newHeight <= this.activeConfiguration.maxHeightPx)
      && (!this.activeConfiguration.parentHeightLimit || (this.hostNativeElementParentRect.y <= mouseEvent.y
        && mouseEvent.y <= this.hostNativeElementParentRect.y + this.hostNativeElementParentRect.height));
  }

  checkWidthRatio(newWidth, mouseEvent): boolean {
    return (!this.activeConfiguration.maxWidthRatio
      || (newWidth * 100.0 / this.hostNativeElementParentRect.width) <= this.activeConfiguration.maxWidthRatio)
      && (!this.activeConfiguration.parentWidthLimit || (this.hostNativeElementParentRect.x <= mouseEvent.x
        && mouseEvent.x <= this.hostNativeElementParentRect.x + this.hostNativeElementParentRect.width));
  }

  checkHeightRatio(newHeight, mouseEvent): boolean {
    return (!this.activeConfiguration.maxWidthRatio
      || (newHeight * 100.0 / this.hostNativeElementParentRect.height) <= this.activeConfiguration.maxHeightRatio)
      && (!this.activeConfiguration.parentHeightLimit || (this.hostNativeElementParentRect.y <= mouseEvent.y
        && mouseEvent.y <= this.hostNativeElementParentRect.y + this.hostNativeElementParentRect.height));
  }

  adjustHeightPx(height): number {
    return !this.activeConfiguration.heightDeltaPx ? height :
      (height % this.activeConfiguration.heightDeltaPx) > this.activeConfiguration.heightDeltaPx * 0.8 ?
        height - (height % this.activeConfiguration.heightDeltaPx) + this.activeConfiguration.heightDeltaPx :
        height - (height % this.activeConfiguration.heightDeltaPx);
  }

  adjustWidthPx(width): number {
    return !this.activeConfiguration.widthDeltaPx ? width :
      (width % this.activeConfiguration.widthDeltaPx) > this.activeConfiguration.widthDeltaPx * 0.8 ?
        width - (width % this.activeConfiguration.widthDeltaPx) + this.activeConfiguration.widthDeltaPx :
        width - (width % this.activeConfiguration.widthDeltaPx);
  }

  adjustHeightRatio(height): number {
    return height;
  }

  adjustWidthRatio(width): number {
    return width;
  }

  mouseGlobalEventHandler(mouseEvent) {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    if (this.resizableState === ResizableState.Resizing) {
        switch (mouseEvent.type) {
          case 'mousemove':
            const el = this.hostNativeElementRef;
            const pos = this.hostNativeElementPosition;
            const rect = this.hostNativeElementRect;
            const parentRect = this.hostNativeElementParentRect;
            const newPosition = { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
            switch (this.selectedBorder) {
              case ResizableBorder.Top:
                const newTopMargin = (pos.top + (rect.height - (rect.height - mouseEvent.y + rect.y)));
                const newTopHeight = rect.height - mouseEvent.y + rect.y;
                newPosition.y = newTopMargin;
                newPosition.h = newTopHeight;
                switch (this.activeConfiguration.top) {
                  case 'px':
                    if (this.checkHeightPx(newTopHeight, mouseEvent)) {
                      this.renderer.setStyle(el, 'top', newTopMargin + 'px');
                      this.renderer.setStyle(el, 'height', newTopHeight + 'px');
                    }
                    break;
                  case '%':
                    if (this.checkHeightRatio(newTopHeight, mouseEvent)) {
                      this.renderer.setStyle(el, 'top', (newTopMargin * 100.0 / parentRect.height) + '%');
                      this.renderer.setStyle(el, 'height', (newTopHeight * 100.0 / parentRect.height) + '%');
                    }
                    break;
                }
                break;
              case ResizableBorder.Left:
                const newLeftMargin = (pos.left + (rect.width - (rect.width - mouseEvent.x + rect.x)));
                const newLeftWidth = rect.width - mouseEvent.x + rect.x;
                newPosition.x = newLeftMargin;
                newPosition.w = newLeftWidth;
                switch (this.activeConfiguration.left) {
                  case 'px':
                    if (this.checkWidthPx(newLeftWidth, mouseEvent)) {
                      this.renderer.setStyle(el, 'left', newLeftMargin + 'px');
                      this.renderer.setStyle(el, 'width', newLeftWidth + 'px');
                    }
                    break;
                  case '%':
                    if (this.checkWidthRatio(newLeftWidth, mouseEvent)) {
                      this.renderer.setStyle(el, 'left', (newLeftMargin * 100.0 / parentRect.width) + '%');
                      this.renderer.setStyle(el, 'width', (newLeftWidth * 100.0 / parentRect.width) + '%');
                    }
                    break;
                }
                break;
              case ResizableBorder.Right:
                const newRightWidth = this.adjustWidthPx(mouseEvent.x - rect.x);
                newPosition.w = newRightWidth;
                switch (this.activeConfiguration.right) {
                  case 'px':
                    if (this.checkWidthPx(newRightWidth, mouseEvent)) {
                      this.renderer.setStyle(el, 'width', newRightWidth + 'px');
                    }
                    break;
                  case '%':
                    if (this.checkWidthRatio(newRightWidth, mouseEvent)) {
                      this.renderer.setStyle(el, 'width', (newRightWidth * 100.0 / parentRect.width) + '%');
                    }
                    break;
                }
                break;
              case ResizableBorder.Bottom:
                const newBottomHeight = this.adjustHeightPx(mouseEvent.y - rect.y);
                newPosition.h = newBottomHeight;
                switch (this.activeConfiguration.bottom) {
                  case 'px':
                    if (this.checkHeightPx(newBottomHeight, mouseEvent)) {
                      this.renderer.setStyle(el, 'height', newBottomHeight + 'px');
                    }
                    break;
                  case '%':
                    if (this.checkHeightRatio(newBottomHeight, mouseEvent)) {
                      this.renderer.setStyle(el, 'height', (newBottomHeight * 100.0 / parentRect.height) + '%');
                    }
                    break;
                }
                break;
            }
            this.onResize.emit(newPosition);
            break;
          case 'mouseup':
            this.capturePosition();
            if (this.checkBorder(mouseEvent) === this.selectedBorder) {
              this.changeState(ResizableState.Selected);
            } else {
              this.changeState(ResizableState.Resizable);
            }
            break;
        }
    }
  }

  bindEventListeners() {
    ['mousemove', 'mouseup', 'mousedown', 'mouseenter', 'mouseleave'].forEach((eventName) => {
      this.renderer.listen(
        this.hostNativeElementRef,
        eventName,
        (evt) => this.mouseEventHandler(evt));
    });
    ['mousemove', 'mouseup'].forEach((eventName) => {
      this.renderer.listen(
        'window',
        eventName,
        (evt) => this.mouseGlobalEventHandler(evt));
    });
    this.renderer.listen(
      'window',
      'resize',
      () => {
        this.capturePosition();
      }
    );
  }

  applyStyles(newResizableState: ResizableState): void {
    let styleProperty;
    if (this.selectedBorder !== ResizableBorder.None) {
      switch (this.selectedBorder) {
        case ResizableBorder.Top:
          styleProperty = 'border-top';
          break;
        case ResizableBorder.Left:
          styleProperty = 'border-left';
          break;
        case ResizableBorder.Right:
          styleProperty = 'border-right';
          break;
        case ResizableBorder.Bottom:
          styleProperty = 'border-bottom';
          break;
      }
      switch (newResizableState) {
        case ResizableState.Resizable:
          this.renderer.setStyle(this.hostNativeElementRef, styleProperty, '1px orange solid');
          this.renderer.setStyle(this.hostNativeElementRef, 'cursor', 'auto');
          break;
        case ResizableState.Selected:
          this.renderer.setStyle(this.hostNativeElementRef, styleProperty, '5px blue solid');
          this.renderer.setStyle(this.hostNativeElementRef, 'cursor', 'grab');
          break;
        case ResizableState.Resizing:
          this.renderer.setStyle(this.hostNativeElementRef, styleProperty, '5px red dashed');
          this.renderer.setStyle(this.hostNativeElementRef, 'cursor', 'grabbing');
          break;
      }
    }
  }

  capturePosition() {
    this.activeConfiguration.position = this.hostNativeElementRef.style.position ?
      this.hostNativeElementRef.style.position : window.getComputedStyle(this.hostNativeElementRef).getPropertyValue('position');
    if (this.activeConfiguration.position === 'static') {
      this.activeConfiguration.position = 'relative';
      this.renderer.setStyle(this.hostNativeElementRef, 'position', 'relative');
    }
    this.hostNativeElementRect = this.hostNativeElementRef.getBoundingClientRect();
    if (!this.parentElementRef) {
      this.parentElementRef = this.hostNativeElementRef.parentElement;
      while (!(this.parentElementRef.nodeName.toUpperCase() === 'DIV'
        || this.parentElementRef.nodeName.toUpperCase() === 'SECTION'
        || this.parentElementRef.nodeName.toUpperCase() === 'ARTICLE')) {
        this.parentElementRef = this.parentElementRef.parentElement;
      }
    }
    this.hostNativeElementParentRect = this.parentElementRef.getBoundingClientRect();
    this.hostNativeElementPosition = {
      top: this.activeConfiguration.position === 'relative' ?
        parseInt(window.getComputedStyle(this.hostNativeElementRef).getPropertyValue('top'), 0) :
        this.hostNativeElementRef.offsetTop,
      left: this.activeConfiguration.position === 'relative' ?
        parseInt(window.getComputedStyle(this.hostNativeElementRef).getPropertyValue('left'), 0) :
        this.hostNativeElementRef.offsetLeft,
      width: this.hostNativeElementRef.offsetWidth,
      height: this.hostNativeElementRef.offsetHeight
    };
  }

  checkConfiguration(): boolean {
    if (this.activeConfiguration.position === 'static' || this.activeConfiguration.position === 'relative' ||
      this.activeConfiguration.position === 'absolute') {
      if (this.resizableOptions) {
        this.activeConfiguration.top = !!this.resizableOptions.top;
        this.activeConfiguration.left = !!this.resizableOptions.left;
        this.activeConfiguration.right = !!this.resizableOptions.right;
        this.activeConfiguration.bottom = !!this.resizableOptions.bottom;
        this.activeConfiguration.widthDeltaPx = !!this.resizableOptions.widthDeltaPx;
        this.activeConfiguration.heightDeltaPx = !!this.resizableOptions.heightDeltaPx;
        this.activeConfiguration.widthDeltaRatio = !!this.resizableOptions.widthDeltaRatio;
        this.activeConfiguration.heightDeltaRatio = !!this.resizableOptions.heightDeltaRatio;
        this.activeConfiguration.maxWidthPx = !!this.resizableOptions.maxWidthPx;
        this.activeConfiguration.maxHeightPx = !!this.resizableOptions.maxHeightPx;
        this.activeConfiguration.maxWidthRatio = !!this.resizableOptions.maxWidthRatio;
        this.activeConfiguration.maxHeightRatio = !!this.resizableOptions.maxHeightRatio;
        this.activeConfiguration.parentWidthLimit = !!this.resizableOptions.parentWidthLimit;
        this.activeConfiguration.parentHeightLimit = !!this.resizableOptions.parentHeightLimit;
      } else {
        this.activeConfiguration = {
          right: 'px',
          bottom: 'px',
          parentWidthLimit: true,
          parentHeightLimit: true
        };
      }
      return true;
    }
    return false;
  }

  initiate(): void {
    this.hostNativeElementRef = this.elementRef.nativeElement.nextSibling;
    this.capturePosition();
    if (this.checkConfiguration()) {
      this.resizableState = ResizableState.Resizable;
      this.bindEventListeners();
      this.renderer.setStyle(this.hostNativeElementRef, 'border', '1px orange solid');
    }
  }
}
