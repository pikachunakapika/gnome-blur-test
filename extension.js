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

/*

Reference & Credits to:
- https://github.com/CorvetteCole/blur-provider

*/

const { Clutter, Shell, St } = imports.gi;
const Main = imports.ui.main;
const GrabHelper = imports.ui.grabHelper;

class Extension {
    constructor() {
    }

    enable() {

        
        let blurEffect = new Shell.BlurEffect({sigma: 20, mode: Shell.BlurMode.BACKGROUND});
        this.blurActor = new Clutter.Actor({visible: true});
        
        this.blurActor.add_effect_with_name('blur-effect', blurEffect);
        
        this.widget = new St.Widget({
            style: 'background-color: rgba(100, 100, 100, 0.2);', /* border-radius: 200px = ugly blurred round corner background :( */
            x: 600, y: 600,
            width: 400, height: 400,
            reactive: true
        });


        this.blurActor.add_constraint(new Clutter.BindConstraint({
            source: this.widget,
            coordinate: Clutter.BindCoordinate.ALL,
        }));

        this.isMouseDown = false;

        this.widget.connect('button-press-event', (event, user_data) => {
            let [global_x, global_y] = global.get_pointer();
            [this.offsetX, this.offsetY] = [global_x - this.widget.x, global_y - this.widget.y];
            print(global_x, global_y, this.widget.x, this.widget.y);
            this.isMouseDown = true;
            print("PRESS");
            this._grabHelper.grab({ actor: this.widget, onUngrab: () => print("UNGRAB") });

        });

        global.stage.connect('motion-event', () => {
            if (this.isMouseDown) {
                let [x, y] = global.get_pointer();
                this.widget.set_x(x - this.offsetX);
                this.widget.set_y(y - this.offsetY);
                print("MOTION");
            }
        });

        global.stage.connect('button-release-event', () => {
            this.isMouseDown = false;
            print("RELEASE");
            this._grabHelper.ungrab();
        });
        
        Main.layoutManager.addChrome(this.widget);
        Main.uiGroup.insert_child_below(this.blurActor, this.widget);

        this._grabHelper = new GrabHelper.GrabHelper(this.widget);
        this._grabHelper.addActor(Main.uiGroup);
        //this._grabHelper.addActor(this.widget);
        


        this.widget.show();

    }

    disable() {
        if (this.widget) {
            this.blurActor.destroy();
            this.widget.destroy();
        }
    }
}

function init() {
    return new Extension();
}
