import { Component, OnInit } from '@angular/core';


import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';

import * as d3Zoom from 'd3-zoom';
import * as d3Brush from 'd3-brush';

import * as D3 from 'd3';

import * as moment from 'moment';

import * as data from '../../assets/new.json';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})


export class LineChartComponent implements OnInit {

    private title: any = 'Line Chart';
	private selected: any = 0;
	private selectedTime: any = 60;
	private isPlaying: any = true;
	private selectedBrush: any;
	private data: any[];
	private labels: any[];
	private starttime: any;

    private margin  = {top: 10, right: 0, bottom: 10, left: 20};
    private width: number;
    private height: number;

    private x: any;
    private x2: any;
    private y: any;
    private y2: any;
	private svg: any;
	private svg1: any;
    private xAxis: any;
    private xAxis2: any;
	private yAxis: any;

	private context: any;
	private brush: any;
	private brush1: any;
	private zoom: any;
	private area2: d3Shape.Area<[number, number]>;
	private focus: any;


    private line: d3Shape.Line<[number, number]>; // this is line defination
	private area: d3Shape.Area<[number, number]>; // this is line defination

   constructor(private http: HttpClient) {
    // configure margins and width/height of the graph
    this.width = 935;
    this.height = 200;
  }

  ngOnInit() {
	this.http.get('../assets/new.json').subscribe((data) => {
		this.setdata(data['starttime'], data['endtime'], data['labels'], data['datapoints'], data['obsWindowStart'], data['obsWindowEnd']);
		this.buildSvg();
		this.addXandYAxis();
		this.drawLineAndPath();
	});
	 console.log(this.selected);

  }

  setdata(starttime, endtime, labels, datapoints, brushstarttime, brushendtime) {
	this.data = datapoints;
	this.labels = labels;
	this.starttime = starttime;

  }

  onChangeObj(newObj) {
    console.log(newObj);
    this.selected = parseInt(newObj.target.value);
	   d3.select('.svg').remove();
	   d3.select('.svg1').remove();
	   d3.select('.svg-con').append('svg').attr('width', '960').attr('height', '300').attr('class', 'svg');
	   d3.select('.svg1-con').append('svg').attr('width', '955').attr('height', '300').attr('class', 'svg1');
    this.buildSvg();
    this.addXandYAxis();
    this.drawLineAndPath();
  }

  // This method is called when user selects time from the dropdown
  onTimeObj(event) {
	this.selectedTime = parseInt(event.target.value);
	d3.select('.svg').remove();
	d3.select('.svg1').remove();
	d3.select('.svg-con').append('svg').attr('width', '960').attr('height', '300').attr('class', 'svg');
	d3.select('.svg1-con').append('svg').attr('width', '960').attr('height', '300').attr('class', 'svg1');
	this.http.get('../assets/new.json').subscribe((data) => {
		this.setdata(data['starttime'], data['endtime'], data['labels'], data['datapoints'], data['obsWindowStart'], data['obsWindowEnd']);
		const currentTime = this.data[this.data.length - 1].time;
		this.data = this.data.filter(item => currentTime - item.time <= this.selectedTime );
		this.buildSvg();
		this.addXandYAxis();
		this.drawLineAndPath();
	});
  }

    private buildSvg() {
		this.svg = d3.select('.svg').style('stroke', '#000').style('fill', '#4682b3');
		this.svg1 = d3.select('.svg1').style('stroke', '#000').style('fill', '#4682b3');
    }
    private addXandYAxis() {
        // range of data configuring
		this.x = d3Scale.scaleTime().range([0, this.width]);

		this.x2 = d3Scale.scaleTime().range([0, this.width]);


		this.y = d3Scale.scaleLinear().range([this.height, 0]);

		this.y2 = d3Scale.scaleLinear().range([this.height, 20]);

		// Configure the X Axis

		this.xAxis = d3Axis.axisBottom(this.x).tickFormat(D3.timeFormat('%H:%M:%S'));

		this.xAxis2 = d3Axis.axisBottom(this.x2).ticks(D3.timeMinute.every(5)).tickFormat(D3.timeFormat('%H:%M'));


		// Configure the Y Axis
		this.yAxis = d3Axis.axisLeft(this.y);

		this.brush1 = d3Brush.brushX()
		.extent([[0, 0], [this.width, this.height]])
		.on('brush end', null);

		this.brush = d3Brush.brushX()
			.extent([[0, 0], [this.width, this.height]])
			.on('brush end', this.brushed.bind(this));


		this.zoom = d3Zoom.zoom()
			.scaleExtent([1, Infinity])
			.translateExtent([[0, 0], [this.width, this.height]])
			.extent([[0, 0], [this.width, this.height]])
			.on('zoom', this.zoomed.bind(this));


		this.area = d3Shape.area()
			.curve(d3Shape.curveStepBefore)
			.x((d: any) => this.x(moment(this.starttime)
			.add(d.time * 5, 'minutes') ))
			.y0(this.height)
			.y1((d: any) => this.y(d.dataArray[this.selected]));

		this.area2 = d3Shape.area()
			.curve(d3Shape.curveStepBefore)
			.x((d: any) => this.x2(moment(this.starttime)
			.add(d.time * 5, 'minutes') ))
			.y0(this.height)
			.y1((d: any) => this.y2(d.dataArray[this.selected]));

		this.svg.append('defs').append('clipPath')
			.attr('id', 'clip')
			.append('rect')
			.attr('width', this.width)
			.attr('height', this.height);

		this.svg1.append('defs').append('clipPath')
			.attr('id', 'clip')
			.append('rect')
			.attr('width', this.width)
			.attr('height', this.height);

		this.focus = this.svg.append('g')
			.attr('class', 'focus')
			.attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');


		this.context = this.svg1.append('g')
			.attr('class', 'context')
			.attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
}



  	private brushed() {
	    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') { return; } // ignore brush-by-zoom
		   const s = d3.event.selection || this.x2.range();
		   this.selectedBrush = s;
	    this.x.domain(s.map(this.x2.invert, this.x2));
	    this.focus.select('.area').attr('d', this.area);
	    this.focus.select('.axis--x').call(this.xAxis);
	    this.svg.select('.zoom').call(this.zoom.transform, d3Zoom.zoomIdentity
	        .scale(this.width / (s[1] - s[0]))
	        .translate(-s[0], 0));
	}

	private zoomed() {
	    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') { return; } // ignore zoom-by-brush
		   const t = d3.event.transform;
		   this.x.domain(t.rescaleX(this.x2).domain());
	    this.focus.select('.area').attr('d', this.area);
	    this.focus.select('.axis--x').call(this.xAxis);
	    this.context.select('.brush').call(this.brush.move, this.x.range().map(t.invertX, t));
	  }



    private drawLineAndPath() {

		const minMax = d3Array.extent(this.data, (d: any) => { return moment(this.starttime)
		.add(d.time * 5, 'minutes'); });

  this.x.domain(minMax);


		this.y.domain([0, d3Array.max(this.data, (d: any) => d.dataArray[this.selected])]);

		this.x2.domain(this.x.domain());
		this.y2.domain(this.y.domain());


		this.focus.append('path')
			.datum(this.data)
			.attr('class', 'area')
			.attr('clip-path', 'url(#clip)')
			.attr('d', this.area);

		this.focus.append('g')
			.attr('class', 'axis axis--x')
			.attr('transform', 'translate(0,' + this.height + ')')
			.call(this.xAxis);

		this.focus.append('g')
			.attr('class', 'brush1')
			.call(this.brush1)
			.call(this.brush1.move, this.x.range())
			.selectAll('.handle').style('pointer-events', 'none');

		this.context.append('path')
			.datum(this.data)
			.attr('class', 'area')
			.attr('d', this.area2);

		this.context.append('g')
			.attr('class', 'axis axis--x')
			.attr('transform', 'translate(0,' + this.height + ')')
			.call(this.xAxis2);

		this.context.append('g')
			.attr('class', 'axis axis--y')
			.call(this.yAxis);

		this.context.append('g')
			.attr('class', 'brush')
			.attr('id', 'brush')
			.call(this.brush)
			.call(this.brush.move, [50, 84])
			.selectAll('.brush>.handle').remove()
			.selectAll('.brush>.overlay').remove();

		this.svg.append('line')
			.style('fill', 'transparent')
			.attr('class', 'zoom')
			.attr('width', this.width)
			.attr('height', this.height)
			.attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
			.call(this.zoom);

		this.svg1.append('line')
			.style('fill', 'transparent')
			.attr('class', 'zoom')
			.attr('width', this.width)
			.attr('height', this.height)
			.attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
			.call(this.zoom);

		d3.selectAll('.brush>.handle').remove();
		d3.selectAll('.brush>.overlay').remove();

		this.tick();

	}


	private autoBrush() {
		const s = this.selectedBrush;
	 this.x.domain(s.map(this.x2.invert, this.x2));
	 this.focus.select('.area').attr('d', this.area);
	 this.focus.select('.axis--x').call(this.xAxis);
	 this.svg.select('.zoom').call(this.zoom.transform, d3Zoom.zoomIdentity
	        .scale(this.width / (s[1] - s[0]))
	        .translate(-s[0], 0));
	}

	// This method tick the data flow in the chart. It uses 250ms duration to move the chart.
	private tick() {

		const minMax = d3Array.extent(this.data, (d: any) => { return moment(this.starttime)
		.add(d.time * 5, 'minutes'); });

		const duration = 1000;
		// 1 day offset
		const offset = 1 * 60 * 60 * 1000;

		const from =  minMax[0] ? minMax[0].valueOf() : moment().valueOf();
		// 2-days window
		const timeWindow = [from, from + 2 * offset];

		// Recompute x,y domains
		this.x2.domain(timeWindow);
		this.y2.domain([0, d3Array.max(this.data, (d: any) => d.dataArray[this.selected])]);

		this.x.domain([from, from + 5 * 1000]);
		this.y.domain(this.y2.domain());


		// Redraw the line
		this.context.select('.area')
		  .attr('d', this.area2(this.data))
		  .attr('transform', null);

		// Update x axis
		this.context.select('.axis.axis--x')
		  .transition()
		  .duration(duration)
		  .ease(D3.easeLinear)
		  .call(this.xAxis2);

		//   this.focus.select('.axis.axis--x')
		//   .transition()
		//   .duration(duration)
		//   .ease(D3.easeLinear)
		//   .call(this.xAxis);

		// Update y axis
		this.context.select('.axis.axis--y')
		  .transition()
		  .duration(duration)
		  .call(this.yAxis);

		// Slide the line to the left
		this.context.select('.area')
		  .transition()
		  .duration(duration)
		  .ease(D3.easeLinear)
		  .attr('transform', 'translate(' + this.x2(from - duration) + ',0)')
		  .on('end', () => {

		if (!this.isPlaying) {
			this.autoBrush();
			return;
		}
		this.autoBrush();
		this.tick();
		});

		// Remove first point
		this.data.shift();

	  }

	  // This method is called when play or pause button is clicked
	  onPlayPause(event) {
		  this.isPlaying = !this.isPlaying;
		  this.autoBrush();
		  this.tick();
	  }

}
