/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

 /* exported init */ 

const { Clutter, Shell, St } = imports.gi;
const Main = imports.ui.main;
const GrabHelper = imports.ui.grabHelper;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ExtensionManager = Main.extensionManager;

const DashToDock = ExtensionManager.lookup('dash-to-dock@micxgx.gmail.com');

class Extension {
    constructor() {
    }

    add_blur_effect(target) {
        let blurEffect = new Shell.BlurEffect({sigma: 20, mode: Shell.BlurMode.BACKGROUND});
        target.add_effect_with_name('blur-effect', blurEffect);
    }

    /*
    // Don't think extra actor for blur alone is needed...
    add_blur_actor(target, container) {

        if (!container) 
            container = target;
        
        let blurActor = new Clutter.Actor({visible: true, width: target.width, height: target.height});
        container.add_actor(blurActor);

        blurActor.add_constraint(new Clutter.BindConstraint({
            source: target,
            coordinate: Clutter.BindCoordinate.ALL
        }));

        this.add_blur_effect(target);
    }
    */

    create_draggable_box() {

        let widget = new St.Widget({
            style: 'background-color: rgba(100, 100, 100, 0.2);', /* border-radius: 200px = ugly blurred round corner background :( */
            x: 600, y: 600,
            width: 400, height: 400,
            reactive: true
        });

        this._grabHelper = new GrabHelper.GrabHelper(widget);

        this.isMouseDown = false;

        widget.connect('button-press-event', (event, user_data) => {
            let [global_x, global_y] = global.get_pointer();
            [this.offsetX, this.offsetY] = [global_x - widget.x, global_y - widget.y];
            this.isMouseDown = true;
            this._grabHelper.grab({ actor: widget});

        });

        global.stage.connect('motion-event', () => {
            if (this.isMouseDown) {
                let [x, y] = global.get_pointer();
                widget.set_x(x - this.offsetX);
                widget.set_y(y - this.offsetY);
            }
        });

        global.stage.connect('button-release-event', () => {
            this.isMouseDown = false;
            this._grabHelper.ungrab();
        });
        
        Main.layoutManager.addChrome(widget);
        
        this._grabHelper.addActor(Main.uiGroup);

        return widget;
    }

    enable() {

        this.widget = this.create_draggable_box();
        this.add_blur_effect(this.widget);
        this.widget.show();

        if (DashToDock && DashToDock.imports) {
            
            const docking = DashToDock.imports.docking;
            if (docking) {
                const dockManager = docking.DockManager.getDefault();

                if (dockManager && dockManager.mainDock && dockManager.mainDock.dash && dockManager.mainDock.dash._container) {
                    dockManager.mainDock.dash._container.set_offscreen_redirect(0);
                    //this.add_blur_actor(dockManager.mainDock, dockManager.mainDock.dash._container);
                    this.add_blur_effect(dockManager.mainDock.dash);
                    //dockManager.mainDock.dash.style = 'background-color: blue';
                }
            }
        }

    }

    disable() {
        
        if (this.widget) {
            this.widget.destroy();
        }
    }
}

function init() {
    return new Extension();
}
