function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Node{
    constructor(name, shape, fixed,info="", x=0, y=0) {
        this.r = 10;
        this.name = name;
        this.options = {
            isStatic: fixed,
            restitution: 1,
            friction: 0,
            density: 1
        }
        if (x != 0) {
          this.x = x;
          this.y = y;
        } else {
          this.x = getRandomInt(100, 400);
          this.y = getRandomInt(50, 200);
        }
        this.shape = shape;
        this.info = info;
        this.active = false;
        this.width = this.r*2;
        this.square = this.width*4
        this.body = Matter.Bodies.circle(this.x, this.y, this.r, this.options);
        this.body2 = Matter.Bodies.rectangle(this.x, this.y, this.square, this.square);
        this.body2.collisionFilter = {
            'group': -1, // Negative group ensures no collisions with bodies in the same group
            'category': 2,
            'mask': 0
        };
        Matter.World.add(world, this.body);
    }
    display() {
        var pos = this.body.position;
        push();
        ellipseMode(CENTER);
        strokeWeight(5);
        stroke(0);
        fill("white");
        if (this.active) {
            if (darkon) {
                fill("green");
            } else {
                fill(0, 116, 217);
            }
        }
        ellipse(pos.x, pos.y, this.width, this.width);
        text(this.name, pos.x,pos.y);
        pop();
    }

    toObject() {
      return {
        name: this.name,
        shape: "circle",
        fixed: this.options.isStatic,
        info: this.info,
        x: this.x,
        y: this.y,
      }
    }
}

class Link{
    constructor(body1, body2, length1) {
        var options = {
            bodyA: body1.body,
            bodyB: body2.body,
            length: length1,
            stiffness: 0.1
        }
        this.length1 = length1;
        this.body1 = body1;
        this.body2 = body2;
        this.link = Matter.Constraint.create(options);
        World.add(world, this.link);
    }
    display() {
        var pointA = this.link.bodyA.position;
        var pointB = this.link.bodyB.position;
        strokeWeight(5);
        stroke(0);
        line(pointA.x, pointA.y, pointB.x, pointB.y);
    }
    toObject() {
      return {
        body1: this.body1.name,
        body2: this.body2.name,
        length: this.length1
      }
    }
}

class Controls {
  static move(controls) {
    function mousePressed() {
      controls.viewPos.isDragging = true;
      controls.viewPos.prevX = mouseX;
      controls.viewPos.prevY = mouseY;
      console.log(mouseX, mouseY);
    }

    function mouseDragged() {
      const {prevX, prevY, isDragging} = controls.viewPos;
      if(!isDragging) return;

      const pos = {x: mouseX, y: mouseY};
      const dx = pos.x - prevX;
      const dy = pos.y - prevY;

      if(prevX || prevY) {
        controls.view.x += dx;
        controls.view.y += dy;
        controls.viewPos.prevX = pos.x, controls.viewPos.prevY = pos.y;
        Matter.Composite.allBodies(world).forEach(body => {
          Matter.Body.translate(body, {x: dx, y: dy})
        })
      }
    }

    function mouseReleased() {
      controls.viewPos.isDragging = false;
      controls.viewPos.prevX = null;
      controls.viewPos.prevY = null;
    }

    return {
      mousePressed, 
      mouseDragged, 
      mouseReleased
    }
  }

  static zoom(controls) {
    function worldZoom(e) {
      const {x, y, deltaY} = e;
      const direction = deltaY > 0 ? -1 : 1;
      const factor = 0.01;
      const zoom = 1 * direction * factor;

      const wx = (x-controls.view.x)/(width*controls.view.zoom);
      const wy = (y-controls.view.y)/(height*controls.view.zoom);
      
      //controls.view.x -= wx*width*zoom;
      //controls.view.y -= wy*height*zoom;
      controls.view.zoom += zoom;
      controls.view.zoom = constrain(controls.view.zoom, 0.1, 5);

      Matter.Composite.allBodies(world).forEach(body => {
        Matter.Body.scale(body, 1/controls.view.zoom, 1/controls.view.zoom);
      })
    }

    return {worldZoom}
  }
}