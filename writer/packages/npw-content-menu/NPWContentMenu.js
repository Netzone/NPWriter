import {Toolbox} from 'substance'

/*
 A default implementation to render the content for the overlay (aka popup) tools.
 */
class ContentMenu extends Toolbox {

    didMount() {
        super.didMount()
        this.context.scrollPane.on('dom-selection:rendered', this._position, this)
    }

    dispose() {
        super.dispose()
        this.context.scrollPane.off(this)
    }

    getInitialState() {
        let state = super.getInitialState()
        state.open = false
        return state
    }

    getActiveToolGroups() {
        return super.getActiveToolGroups()
    }

    render($$) {
        var Button = this.getComponent('button')
        var el = $$('div').addClass('sc-content-menu')

        el.css({
            left: this._left + 'px',
            top: this._top + 'px'
        })

        if (this.hasActiveTools()) {
            var toggleEl = $$('div')
                .addClass('se-toggle')
                .on('click', this.onToggle)

            el.append(toggleEl);

            if (!this.state.open) {
                toggleEl.append(
                    $$(Button, {icon: 'content-menu-open'})
                )
            }
            else {
                toggleEl.append(
                    $$(Button, {icon: 'content-menu-close'})
                );
                var availableToolsEl = $$('div').addClass('se-available-tools se-l-arrow-box');

                el.addClass('sm-content-tools-open')
                el.addClass('sm-theme-' + this.getTheme())
                let activeToolGroups = this.state.activeToolGroups

                activeToolGroups.forEach((toolGroup) => {
                    let toolGroupProps = Object.assign({}, toolGroup, {
                        toolStyle: this.getToolStyle(),
                        showIcons: true
                    })
                    availableToolsEl.append(
                        $$(toolGroup.Class, toolGroupProps)
                    )
                })
                el.append(availableToolsEl);
            }
        } else {
            el.addClass('sm-hidden')
        }


        return el;
    }

    shouldRerender() {
        return true
    }

    onToggle(e) {
        e.stopPropagation()
        e.preventDefault()
        this.extendState({
            open: !this.state.open
        })
    }

    hide() {
        this.el.addClass('sm-hidden')
    }

    /*
     Update and re-position
     */
    _position(hints) {
        if (this.hasActiveTools()) {
            this.el.removeClass('sm-hidden')
            if (hints) {
                let selRect = hints.selectionRect

                // HACK: Use surface element as the left reference point
                // Could not use surface class because it caused problem with the header group editor
                let surfaceEl = this.el.parentNode.find('.sc-container-editor').getNativeElement()
                let surfaceRect = surfaceEl.getBoundingClientRect()

                // By default, gutter is centered (y-axis) and left of the scrollPane content (x-axis)
                this._top = selRect.top
                this.el.css('top', this._top)
                const MARGIN = 30
                this._left = surfaceRect.left - MARGIN
                this.el.css('left', this._left)
            }
        } else {
            this.el.addClass('sm-hidden')
        }
    }

    /*
     Override if you just want to use a different style
     */
    getToolStyle() {
        return 'outline-dark'
    }

    getTheme() {
        return 'dark'
    }

    getActiveToolGroupNames() {
        return ['content-top-menu', 'content-menu']
    }

}

export default ContentMenu
