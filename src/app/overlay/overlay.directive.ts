import {
  ComponentFactoryResolver,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
  Input
} from '@angular/core';
import {OverlayComponent} from './overlay.component';
import {WrapperContainerComponent} from './wrapper-container.component';
import {isArray, isNull} from 'util';

@Directive({
  selector: '[appOverlay]'
})
export class OverlayDirective implements OnDestroy, OnInit {
  private wrapperComponentRef;
  private overlayQueue: any = [];
  @Input('appOverlay') overlaySubject: string;

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) { }

  ngOnInit(): void {
    this.initiate();
  }

  applyStyles(overlayNativeElementRef, hostNativeElementRef, overlayConfiguration: any = {}): void {
    const zIndex = Number(hostNativeElementRef.style.zIndex ? hostNativeElementRef.style.zIndex : 1);
    this.renderer.setAttribute(overlayNativeElementRef, 'class', '');
    this.renderer.setAttribute(overlayNativeElementRef, 'style', '');
    this.renderer.setStyle(overlayNativeElementRef, 'z-index', overlayConfiguration.zIndex ? overlayConfiguration.zIndex : zIndex + 1);
    this.renderer.setStyle(overlayNativeElementRef, 'position', overlayConfiguration.window ? 'fixed' : 'absolute');
    if (overlayConfiguration.classes && isArray(overlayConfiguration.classes)) {
      overlayConfiguration.classes.forEach((className) => this.renderer.addClass(overlayNativeElementRef, className));
    } else {
      this.renderer.setStyle(overlayNativeElementRef, 'background-color', 'rgb(0,0,0,0.75)');
    }
  }

  private getSize(requiredSize, targetSize): number {
    const matches = requiredSize.match('^([0-9]+(?:\.[0-9]+)?)(px|%)$');
    if (matches) {
      return matches[2] === 'px' ? Number(matches[1]) : targetSize * Number(matches[1]) / 100.0;
    } else {
      return targetSize;
    }
  }

  private getOffsetTop(requiredOffset, requiredHeight, hostOffset, hostHeight, inverted = false): number {
    const matches = requiredOffset.match('^(\-?[0-9]+(?:\.[0-9]+)?)(px|%)(?:\ *\,\ *(-?[0-9]+(?:\.[0-9]+)?)px)?$');
    const margin = (matches && matches[3]) ? Number(matches[3]) : 0;
    if (requiredOffset === 'center') {
      return hostOffset + (hostHeight - requiredHeight) / 2.0;
    } else {
      if (!matches) {
        return hostOffset;
      } else {
        if (!inverted) {
          return matches[2] === 'px' ? hostOffset + Number(matches[1]) + margin :
            hostOffset + hostHeight * Number(matches[1]) / 100.0 + margin;
        } else {
          return matches[2] === 'px' ? hostOffset + hostHeight - requiredHeight - Number(matches[1]) - margin :
            hostOffset + hostHeight - requiredHeight - hostHeight * Number(matches[1]) / 100.0 - margin;
        }
      }
    }
  }

  private getOffsetLeft(requiredOffset, requiredWidth, hostOffset, hostWidth, inverted = false): number {
    const matches = requiredOffset.match('^(\-?[0-9]+(?:\.[0-9]+)?)(px|%)(?:\ *\,\ *(-?[0-9]+(?:\.[0-9]+)?)px)?$');
    const margin = (matches && matches[3]) ? Number(matches[3]) : 0;
    if (requiredOffset === 'center') {
      return hostOffset + (hostWidth - requiredWidth) / 2.0;
    } else {
      if (!matches) {
        return hostOffset;
      } else {
        if (!inverted) {
          return matches[2] === 'px' ? hostOffset + Number(matches[1]) + margin :
            hostOffset + hostWidth * Number(matches[1]) / 100.0 + margin;
        } else {
          return matches[2] === 'px' ? hostOffset + hostWidth - requiredWidth - Number(matches[1]) - Number(matches[3]) - margin :
            hostOffset + hostWidth - requiredWidth - hostWidth * Number(matches[1]) / 100.0 - margin;
        }
      }
    }
  }

  alignOverlayPosition(overlayNativeElementRef, hostNativeElementRef, overlayConfiguration: any = {}): void {
    if (overlayConfiguration.window) {
      if (overlayConfiguration.position.hasOwnProperty('top')) {
        this.renderer.setStyle(overlayNativeElementRef, 'top', isNaN(overlayConfiguration.position.top) ?
          overlayConfiguration.position.top : overlayConfiguration.position.top + 'px');
      } else if (overlayConfiguration.position.hasOwnProperty('bottom')) {
        this.renderer.setStyle(overlayNativeElementRef, 'bottom', isNaN(overlayConfiguration.position.bottom) ?
          overlayConfiguration.position.bottom : overlayConfiguration.position.bottom + 'px');
      }

      if (overlayConfiguration.position.hasOwnProperty('left')) {
        this.renderer.setStyle(overlayNativeElementRef, 'left', isNaN(overlayConfiguration.position.left) ?
          overlayConfiguration.position.left : overlayConfiguration.position.left + 'px');
      } else if (overlayConfiguration.position.hasOwnProperty('right')) {
        this.renderer.setStyle(overlayNativeElementRef, 'right', isNaN(overlayConfiguration.position.right) ?
          overlayConfiguration.position.right : overlayConfiguration.position.right + 'px');
      }

      if (overlayConfiguration.position.hasOwnProperty('width')) {
        this.renderer.setStyle(overlayNativeElementRef, 'width', isNaN(overlayConfiguration.position.width) ?
          overlayConfiguration.position.width : overlayConfiguration.position.width + 'px');
      }

      if (overlayConfiguration.position.hasOwnProperty('height')) {
        this.renderer.setStyle(overlayNativeElementRef, 'height', isNaN(overlayConfiguration.position.height) ?
          overlayConfiguration.position.height : overlayConfiguration.position.height + 'px');
      }
    } else {
      const targetPosition = {
        top: hostNativeElementRef.offsetTop, left: hostNativeElementRef.offsetLeft,
        width: hostNativeElementRef.offsetWidth, height: hostNativeElementRef.offsetHeight
      };
      if (overlayConfiguration.position) {
        if (overlayConfiguration.position.width) {
          targetPosition.width = isNaN(overlayConfiguration.position.width) ?
            this.getSize(overlayConfiguration.position.width, targetPosition.width) : Number(overlayConfiguration.position.width);
        }

        if (overlayConfiguration.position.height) {
          targetPosition.height = isNaN(overlayConfiguration.position.height) ?
            this.getSize(overlayConfiguration.position.height, targetPosition.height) : Number(overlayConfiguration.position.height);
        }

        if (overlayConfiguration.position.hasOwnProperty('top')) {
          targetPosition.top = isNaN(overlayConfiguration.position.top) ?
            this.getOffsetTop(
              overlayConfiguration.position.top,
              targetPosition.height,
              hostNativeElementRef.offsetTop,
              hostNativeElementRef.offsetHeight
            ) : targetPosition.top + Number(overlayConfiguration.position.top);
        } else if (overlayConfiguration.position.hasOwnProperty('bottom')) {
          targetPosition.top = isNaN(overlayConfiguration.position.bottom) ?
            this.getOffsetTop(
              overlayConfiguration.position.bottom,
              targetPosition.height,
              hostNativeElementRef.offsetTop,
              hostNativeElementRef.offsetHeight,
              true
            ) : hostNativeElementRef.offsetTop + Number(
            hostNativeElementRef.offsetHeight - targetPosition.height - overlayConfiguration.position.bottom
          );
        }

        if (overlayConfiguration.position.hasOwnProperty('left')) {
          targetPosition.left = isNaN(overlayConfiguration.position.left) ?
            this.getOffsetLeft(
              overlayConfiguration.position.left,
              targetPosition.width,
              hostNativeElementRef.offsetLeft,
              hostNativeElementRef.offsetWidth
            ) : targetPosition.left + Number(overlayConfiguration.position.left);
        } else if (overlayConfiguration.position.hasOwnProperty('right')) {
          targetPosition.left = isNaN(overlayConfiguration.position.right) ?
            this.getOffsetLeft(
              overlayConfiguration.position.right,
              targetPosition.width,
              hostNativeElementRef.offsetLeft,
              hostNativeElementRef.offsetWidth,
              true
            ) : hostNativeElementRef.offsetLeft + Number(
            hostNativeElementRef.offsetWidth - targetPosition.width - overlayConfiguration.position.right
          );
        }
      }

      this.renderer.setStyle(overlayNativeElementRef, 'top', targetPosition.top + 'px');
      this.renderer.setStyle(overlayNativeElementRef, 'left', targetPosition.left + 'px');
      this.renderer.setStyle(overlayNativeElementRef, 'width', targetPosition.width + 'px');
      this.renderer.setStyle(overlayNativeElementRef, 'height', targetPosition.height + 'px');
    }
  }

  private getOverlay(overlayId: string): any {
    for (const overlayDetailRef of this.overlayQueue) {
      if (overlayDetailRef.id === overlayId) {
        return overlayDetailRef;
      }
    }
    return null;
  }

  private setOverlay(overlayDetailRef: any = {}): void {
    for (const [index, currentOverlayDetailRef] of this.overlayQueue.entries()) {
      if (currentOverlayDetailRef.id === overlayDetailRef.id) {
        overlayDetailRef.componentRef = this.overlayQueue[index].componentRef ? this.overlayQueue[index].componentRef : null;
        this.overlayQueue[index] = overlayDetailRef;
        return;
      }
    }
  }

  registerOverlay(overlayConfiguration: any = {}) {
    overlayConfiguration.id = (Math.random().toString(36) + '00000000000000000').slice(2, 8 + 2);
    this.overlayQueue.push(overlayConfiguration);
  }

  renderOverlay(overlayNativeElementRef, hostNativeElementRef, overlayConfiguration: any = {}) {
    this.applyStyles(overlayNativeElementRef, hostNativeElementRef, overlayConfiguration);
    this.alignOverlayPosition(overlayNativeElementRef, hostNativeElementRef, overlayConfiguration);
    this.renderer.listen(
      overlayNativeElementRef,
      'overlayEvent',
      (evt) => this.overlayEventHandler(evt)
    );
    if (overlayConfiguration.self && overlayConfiguration.self.overlayHandlerCallback) {
      overlayConfiguration.self.overlayHandlerCallback(overlayConfiguration);
    }
  }

  overlayCreate(overlayEvent) {
    this.registerOverlay(overlayEvent.detail);
    const componentRef = this.viewContainer.createComponent(this.componentFactoryResolver.resolveComponentFactory(OverlayComponent));
    componentRef.instance.initiate(overlayEvent.detail.component, overlayEvent.detail);
    const overlayNativeElementRef = componentRef.instance.targetNativeElement;
    const hostNativeElementRef = this.wrapperComponentRef.instance.elementRef.nativeElement.firstChild;
    overlayEvent.detail.componentRef = componentRef;
    overlayEvent.detail.hostNativeElementRef = hostNativeElementRef;
    this.renderOverlay(overlayNativeElementRef, hostNativeElementRef, overlayEvent.detail);
  }

  checkOverlayEvent(overlayEvent): boolean {
    if (overlayEvent.detail && overlayEvent.detail.action) {
      return !this.overlaySubject ? true :
        overlayEvent.detail.subject ? !isNull(overlayEvent.detail.subject.match(this.overlaySubject)) : false;
    } else {
      return false;
    }
  }

  overlayUpdate(overlayEvent) {
    if (overlayEvent.detail.id) {
      this.setOverlay(overlayEvent.detail);
      const overlayDetailRef = this.getOverlay(overlayEvent.detail.id);
      const overlayNativeElementRef = overlayDetailRef.componentRef.instance.targetNativeElement;
      const hostNativeElementRef = this.wrapperComponentRef.instance.elementRef.nativeElement.firstChild;
      this.applyStyles(overlayNativeElementRef, hostNativeElementRef, overlayDetailRef);
      this.alignOverlayPosition(overlayNativeElementRef, hostNativeElementRef, overlayDetailRef);
    }
  }

  overlayDelete(overlayEvent) {
    for (const [index, currentOverlayDetailRef] of this.overlayQueue.entries()) {
      if (currentOverlayDetailRef.id === overlayEvent.detail.id) {
        currentOverlayDetailRef.componentRef.destroy();
        this.overlayQueue.splice(index, 1);
        return;
      }
    }
  }

  overlayEventHandler(overlayEvent): void {
    overlayEvent.preventDefault();
    if (this.checkOverlayEvent(overlayEvent)) {
      if (!overlayEvent.detail.multilayer) {
        overlayEvent.stopPropagation();
      }
      switch (overlayEvent.detail.action.toUpperCase()) {
        case 'CREATE':
          this.overlayCreate(overlayEvent);
          break;
        case 'UPDATE':
          this.overlayUpdate(overlayEvent);
          break;
        case 'DELETE':
          this.overlayDelete(overlayEvent);
          break;
      }
    }
  }

  initiate(): void {
    this.viewContainer.clear();
    this.wrapperComponentRef = this.viewContainer.createComponent(
      this.componentFactoryResolver.resolveComponentFactory(WrapperContainerComponent)
    );
    this.wrapperComponentRef.instance.template = this.templateRef;

    this.renderer.listen(
      this.wrapperComponentRef.instance.elementRef.nativeElement,
      'overlayEvent',
      (evt) => this.overlayEventHandler(evt)
    );

    this.renderer.listen(
      'window',
      'resize',
      () => {
        const hostNativeElementRef = this.wrapperComponentRef.instance.elementRef.nativeElement.firstChild;
        this.overlayQueue.forEach((overlayRef) => {
          const overlayNativeElementRef = overlayRef.componentRef.instance.targetNativeElement;
          this.alignOverlayPosition(
            overlayNativeElementRef,
            hostNativeElementRef,
            overlayRef
          );
        });
      }
    );
  }

  ngOnDestroy() {
    this.overlayQueue.forEach((overlayRef) => {
      if (overlayRef.componentRef) {
        overlayRef.componentRef.destroy();
      }
    });
  }
}
