class AroToolTipController {
    constructor (state) {
        this.state = state

    }
}

AroToolTipController.$inject = ['state']

let aroToolTip = {
    template: `
    <div class="aro-tool-tip">
        <ng-content></ng-content>
    </div>
    `,
    controller: AroToolTipController
}

export default aroToolTip
