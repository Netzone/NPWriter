import {Toolbox} from 'substance'

class OverlayMenu extends Toolbox {


    didMount() {
        super.didMount()
        if (!this.context.scrollPane) {
            throw new Error('Requires scrollPane context')
        }
        this.context.scrollPane.on('dom-selection:rendered', this._position, this)
    }

    dispose() {
        super.dispose()
        this.context.scrollPane.off(this)
    }

    render($$) {
        let el = $$('div').addClass(this.getClassNames())
        el.addClass('sm-hidden')
        let activeToolGroups = this.state.activeToolGroups
        let activeToolsEl = $$('div').addClass('se-active-tools').addClass('se-b-arrow-box')

        activeToolGroups.forEach((toolGroup) => {
            let toolGroupProps = Object.assign({}, toolGroup, {
                toolStyle: this.getToolStyle(),
                showIcons: true
            })
            activeToolsEl.append(
                $$(toolGroup.Class, toolGroupProps)
            )
        })

        el.append(activeToolsEl)
        return el
    }

    /*
     Override if you just want to use a different style
     */
    getToolStyle() {
        return 'outline-dark'
    }

    show(hints) {
        this.el.removeClass('sm-hidden')
        this._position(hints)
    }

    hide() {
        this.el.addClass('sm-hidden')
    }

    _position(hints) {

        if (this.hasActiveTools()) {

            this.el.removeClass('sm-hidden')

            let contentWidth = this.el.htmlProp('offsetWidth')
            let selRect = hints.selectionRect
            let selectionMaxWidth = selRect.width

            // By default, Overlays are aligned center/bottom to the selection
            this.el.css('top', selRect.top - 45 )
            let leftPos = selRect.left + selectionMaxWidth/2 - contentWidth/2
            // Must not exceed left bound
            leftPos = Math.max(leftPos, 0)
            // Must not exceed right bound
            let maxLeftPos = selRect.left + selectionMaxWidth + selRect.right - contentWidth
            leftPos = Math.min(leftPos, maxLeftPos)
            this.el.css('left', leftPos)
        } else {
            this.el.addClass('sm-hidden')
        }
    }


    getClassNames() {
        return 'sc-overlay'
    }
    getActiveToolGroupNames() {
        // If we have more toolgroups just add to this array
        return ['overlay']
    }

}

export default OverlayMenu