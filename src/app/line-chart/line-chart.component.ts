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

import * as Jsondata from '../../assets/new.json';
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
	private endTime: any;

    private margin  = {top: 10, right: 0, bottom: 10, left: 50};
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
	private masterData: any;
	private durations = [10, 30 , 60];


    private line: d3Shape.Line<[number, number]>; // this is line defination
	private area: d3Shape.Area<[number, number]>; // this is line defination

   constructor(private http: HttpClient) {
    // configure margins and width/height of the graph
    this.width = 894;
    this.height = 108;
  }

  ngOnInit() {
	this.http.get('../assets/new.json').subscribe((data) => {
		this.masterData = JSON.parse(JSON.stringify(data));
		this.setdata(data.startTime, data.endTime, data.labels, data.dataPoints, data.obsWindowStart, data.obsWindowEnd);
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
	this.endTime = endtime;
  }

  onChangeObj(newObj) {
    console.log(newObj);
    this.selected = parseInt(newObj.target.value);
	d3.select('.svg').remove();
	d3.select('.svg1').remove();
	d3.select('.svg-con').append('svg').attr('width', '900').attr('height', '150').attr('class', 'svg');
	d3.select('.svg1-con').append('svg').attr('width', '900').attr('height', '150').attr('class', 'svg1');
    this.buildSvg();
    this.addXandYAxis();
    this.drawLineAndPath();
  }

  // This method is called when user selects time from the dropdown
  onTimeObj(event) {
	this.selectedTime = parseInt(event.target.value);
	d3.select('.svg').remove();
	d3.select('.svg1').remove();
	d3.select('.svg-con').append('svg').attr('width', '900').attr('height', '150').attr('class', 'svg');
	d3.select('.svg1-con').append('svg').attr('width', '900').attr('height', '150').attr('class', 'svg1');
	this.data = this.masterData.dataPoints.slice(this.masterData.dataPoints.length - this.selectedTime);
	this.buildSvg();
	this.addXandYAxis();
	this.drawLineAndPath();
  }

    private buildSvg() {
		this.svg = d3.select('.svg').style('stroke', '#000').style('fill', '#4682b3');
		this.svg1 = d3.select('.svg1').style('stroke', '#000').style('fill', '#4682b3');
    }
    private addXandYAxis() {
        // range of data configuring
		this.x = d3Scale.scaleTime().range([0, this.width]);

		this.x2 = d3Scale.scaleTime().range([0, this.width]);


		this.y = d3Scale.scaleLinear().range([this.height, 20]);

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
			.x((d: any) => this.x(new Date(d.time)))
			.y0(this.height)
			.y1((d: any) => this.y(d.dataArray[this.selected]));

		this.area2 = d3Shape.area()
			.curve(d3Shape.curveStepBefore)
			.x((d: any) => this.x2(new Date(d.time)))
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
			.call(this.brush.move, [50, 130])
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

		if (this.data.length === 0) {
			return;
		}

		const xminMax = d3Array.extent(this.data, (d: any) => new Date(d.time));
		const yMinMax = d3Array.extent(this.data, (d: any) => d.dataArray[this.selected])
		const durationMap = { 10: 2000, 30: 2000, 60: 1000 };
		const duration = 1000;

		const from =  xminMax[0] ? xminMax[0].valueOf() : moment().valueOf();
		// 2-days window
		const timeWindow = [new Date(from), new Date(xminMax[1].valueOf())];

		// Recompute x,y domains
		this.x2.domain(timeWindow);
		this.y2.domain(yMinMax);

		this.x.domain(this.x2.domain());
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
		let finalObj = JSON.parse(JSON.stringify(this.data[this.data.length - 1 ]));
		finalObj.time = moment(finalObj.time).add(1, 'minutes').valueOf();
		finalObj.dataArray = [Math.floor(Math.random() * (200 - 10) + 10), Math.floor(Math.random() * (10000 - 10) + 1000) ]
		this.masterData.dataPoints.push(finalObj);
		this.data.push(finalObj);

	  }

	  // This method is called when play or pause button is clicked
	  onPlayPause(event) {
		  this.isPlaying = !this.isPlaying;
		  this.autoBrush();
		  this.tick();
	  }

}
