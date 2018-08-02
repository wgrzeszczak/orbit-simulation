import Constants from './math/constants';
import Vector2D from './math/vector';

export default class App {
    constructor(document, view, canvas, panel) {
        this.document = document;
        this.view = view;
        this.canvas = canvas;
        this.panel = panel;

        this.canvasContext = this.canvas.getContext('2d');
        this.speedInput = this.panel.querySelector('.speedinput');
        this.speedInputValue = this.panel.querySelector('.speedinputvalue');
        this.zoomInput = this.panel.querySelector('.zoominput');
        this.zoomInputValue = this.panel.querySelector('.zoominputvalue');
        this.dateInput = this.panel.querySelector('.date');
        this.currentDate = this.panel.querySelector('.currentdatevalue');

        this.semimajoraxisInput = this.panel.querySelector('.semimajoraxis');
        this.semimajoraxisCenturyInput = this.panel.querySelector('.semimajoraxiscentury');
        this.eccentricityInput = this.panel.querySelector('.eccentricity');
        this.eccentricityCenturyInput = this.panel.querySelector('.eccentricitycentury');
        this.inclinationInput = this.panel.querySelector('.inclination');
        this.inclinationCenturyInput = this.panel.querySelector('.inclinationcentury');
        this.meanLongitudeInput = this.panel.querySelector('.meanlongitude');
        this.meanLongitudeCenturyInput = this.panel.querySelector('.meanlongitudecentury');
        this.longitudeOfPerihelionInput = this.panel.querySelector('.longitudeofperihelion');
        this.longitudeOfPerihelionCenturyInput = this.panel.querySelector('.longitudeofperihelioncentury');
        this.longitudeOfAscendingNodeInput = this.panel.querySelector('.longitudeofascendingnode');
        this.longitudeOfAscendingNodeCenturyInput = this.panel.querySelector('.longitudeofascendingnodecentury');
        this.outputPanel = this.panel.querySelector('.output');
        this.renderResolution = this.panel.querySelector('.renderresolution');
        this.renderDeltaTime = this.panel.querySelector('.renderdeltatime');

        this.degtoradin = this.panel.querySelector('.degtoradin');
        this.degtoradout = this.panel.querySelector('.degtoradout');
        this.radtodegin = this.panel.querySelector('.radtodegin');
        this.radtodegout = this.panel.querySelector('.radtodegout');

        this.elapsed = 0;
        this.lastUpdate = Date.now();
        this.planetPosition = new Vector2D();
        this.output = {};
        this.initialize();
    }

    initialize() {
        const onResize = () => {
            this.canvas.width = this.view.innerWidth;
            this.canvas.height = this.view.innerHeight;
            this.renderResolution.textContent = `${this.view.innerWidth}x${this.view.innerHeight}`;
        };

        this.view.addEventListener('resize', () => onResize());
        this.dateInput.addEventListener('input', () => this.elapsed = 0);
        this.degtoradin.addEventListener('input', () => this.degtoradout.value = Number(this.degtoradin.value) * Math.PI / 180.0);
        this.radtodegin.addEventListener('input', () => this.radtodegout.value = Number(this.radtodegin.value) * 180.0 / Math.PI);        
        onResize();
    }

    getOrbitalParameters() {
        return {
            a0: Number(this.semimajoraxisInput.value) * Constants.AU,
            e0: Math.min(Number(this.eccentricityInput.value), 0.9),
            I0: Number(this.inclinationInput.value),
            L0: Number(this.meanLongitudeInput.value),
            Lp0: Number(this.longitudeOfPerihelionInput.value),
            o0: Number(this.longitudeOfAscendingNodeInput.value),
            ac: Number(this.semimajoraxisCenturyInput.value),
            ec: Number(this.eccentricityCenturyInput.value),
            Ic: Number(this.inclinationCenturyInput.value),
            Lc: Number(this.meanLongitudeCenturyInput.value),
            Lpc: Number(this.longitudeOfPerihelionCenturyInput.value),
            oc: Number(this.longitudeOfAscendingNodeCenturyInput.value)
        }
    }

    getJulianDay(date) {
        return date.getTime() / 86400000 + 2440587.5 - 2451543.5; //julian day from 1970 + days to 1970 - days to epoch J2000
    }

    getStateVectors() {
        const date = new Date(this.elapsed + new Date(this.dateInput.value).getTime());

        if(isNaN(date.getTime())) {
            return;
        }
        
        const day = this.getJulianDay(date);
        const T = day / 36525;
        let a = this.orbitalParameters.a0 + this.orbitalParameters.ac * T;
        let e = this.orbitalParameters.e0 + this.orbitalParameters.ec * T;
        let I = this.orbitalParameters.I0 + this.orbitalParameters.Ic * T;
        let L = this.orbitalParameters.L0 + this.orbitalParameters.Lc * T;
        let Lp = this.orbitalParameters.Lp0 + this.orbitalParameters.Lpc * T;
        let o = this.orbitalParameters.o0 + this.orbitalParameters.oc * T;

        let M = ((L - Lp) % 360) * Math.PI / 180;
        let wp = (Lp - o) * Math.PI / 180;
        
        I = I * Math.PI / 180;
        L = L * Math.PI / 180;
        Lp = Lp * Math.PI / 180;
        o = o * Math.PI / 180;

        let E = M;      
        while(true) {
            const ENext = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
            const dE = E - ENext;
            E = ENext;
            if(Math.abs(dE) < 10e-6) {
                break;
            }
        }

        const xp = a * (Math.cos(E) - e);
        const yp = a * Math.sqrt(1 - Math.pow(e, 2)) * Math.sin(E);

        const x = xp * (Math.cos(wp) * Math.cos(o) - Math.sin(wp) * Math.sin(o) * Math.cos(I)) + yp * (-Math.sin(wp) * Math.cos(o) - Math.cos(wp) * Math.sin(o) * Math.cos(I));
        const y = xp * (Math.cos(wp) * Math.sin(o) + Math.sin(wp) * Math.cos(o) * Math.cos(I)) + yp * (-Math.sin(wp) * Math.sin(o) + Math.cos(wp) * Math.cos(o) * Math.cos(I));

        return {
            position: new Vector2D(x / Constants.AU, -y / Constants.AU), //y reversed due to canvas coordinates,
            output: {
                a,
                e,
                I,
                L,
                Lp,
                o,
                wp,
                M, 
                E,
            }
        };
    }

    render() {
        this.canvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.canvasContext.strokeStyle = '#000000';
        this.canvasContext.fillStyle = '#000000';

        this.canvasContext.beginPath();
        this.canvasContext.arc(window.innerWidth / 2 - 4, window.innerHeight / 2 - 4, 8, 0, 2 * Math.PI);
        this.canvasContext.stroke();
        this.canvasContext.fill();
        this.canvasContext.closePath();

        this.canvasContext.beginPath();
        this.canvasContext.arc(
            this.planetPosition.x * Math.pow(2, Number(this.zoomInput.value)) + window.innerWidth / 2, 
            this.planetPosition.y * Math.pow(2, Number(this.zoomInput.value)) + window.innerHeight / 2, 
            5, 0, 2 * Math.PI
        );
        this.canvasContext.stroke();
        this.canvasContext.fill();
        this.canvasContext.closePath();

        this.outputPanel.innerHTML = `
        <section>Semimajor axis: ${this.output.a / Constants.AU} AU</section>
        <section>Eccentricity: ${this.output.e}</section>
        <section>Inclination: ${this.output.I} rad</section>
        <section>Mean longitude: ${this.output.L} rad</section>
        <section>Longitude of perihelion: ${this.output.Lp} rad</section>
        <section>Longitude of ascending node:: ${this.output.o} rad</section>
        <section>Argument of periapsis: ${this.output.wp} rad</section>
        <section>Mean anomaly: ${this.output.M} rad</section>
        <section>Eccentric anomaly: ${this.output.E} rad</section>
        <section>X: ${this.planetPosition.x} AU</section>
        <section>Y: ${-this.planetPosition.y} AU</section>
        `;

        this.speedInputValue.textContent = this.speedInput.value;
        this.zoomInputValue.textContent = this.zoomInput.value;
        
        const options = { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric' 
        };
        this.currentDate.textContent = new Date(this.elapsed + new Date(this.dateInput.value).getTime()).toLocaleDateString("en-US", options);

        requestAnimationFrame(() => this.render());
    }

    update(timeStep) {
        const speedValue = Number(this.speedInput.value);
        this.elapsed += Math.sign(speedValue) * timeStep * Math.pow(10, Math.abs(speedValue));
        this.orbitalParameters = this.getOrbitalParameters();

        const stateVectors = this.getStateVectors(timeStep);
        this.planetPosition = stateVectors.position;
        this.output = stateVectors.output;
    }

    run() {
        setInterval(() => {
            const now = Date.now();
            let deltaTime = (now - this.lastUpdate) / 1000.0;
            this.renderDeltaTime.textContent = deltaTime;
            this.lastUpdate = now;
            this.update(deltaTime);
        }, 1000.0 / 60.0);
        requestAnimationFrame(() => this.render());
    }
}

