		
function drawGraph(filter){
		// console.log(filter);

		let svg = d3.select('svg');
		let width = document.body.clientWidth; // get width in pixels
		let height = +svg.attr('height');
		let centerX = width * 0.5;
		let centerY = height * 0.5;
		let strength = 0.05;
		let focusedNode;

		let format = d3.format(',d');

		 $("#bubblegraph").empty().attr("width", '100%').attr("height", 800);


		let scaleColor;

		setColor(filter);

		function setColor(filter){
			if (filter=="genre" || filter=="both"){
				scaleColor = d3.scaleOrdinal().range(["#B0D5D0", 
			"#91bad8" ,"#FFDEE5", "#E2B1CD", "#FEE8DB"]);
			}
			else{
				scaleColor = d3.scaleOrdinal().range(["#cecece"]);
			}
		}
 
		// let scaleColor = d3.scaleOrdinal(d3.schemeCategory20);

		// use pack to calculate radius of the circle
		let pack = d3.pack()
			.size([width , height ])
			.padding(1.5);

		let forceCollide = d3.forceCollide(d => d.r + 1);

		// use the force
		let simulation = d3.forceSimulation()
			// .force('link', d3.forceLink().id(d => d.id))
			.force('charge', d3.forceManyBody())
			.force('collide', forceCollide)
			// .force('center', d3.forceCenter(centerX, centerY))
			.force('x', d3.forceX(centerX ).strength(strength))
			.force('y', d3.forceY(centerY ).strength(strength));

		// reduce number of circles on mobile screen due to slow computation
		if ('matchMedia' in window && window.matchMedia('(max-device-width: 767px)').matches) {
			data = data.filter(el => {
				return el.value >= 50;
			});
		}

		let root = d3.hierarchy({ children: data })
			.sum(d => d.value);

		// we use pack() to automatically calculate radius conveniently only
		// and get only the leaves
		let nodes = pack(root).leaves().map(node => {
			// console.log('node:', node.x, (node.x - centerX) * 2);
			const data = node.data;


			var radiusHolder=40;
			if (filter=="rating" || filter=="both"){
				radiusHolder = node.r;
			};

			return {
				x: centerX + (node.x - centerX) * 3, // magnify start position to have transition to center movement
				y: centerY + (node.y - centerY) * 3,
				r: 0, // for tweening
				// radius: node.r, //original radius
				radius: radiusHolder, //original radius
				id: data.cat + '.' + (data.name.replace(/\s/g, '-')),
				cat: data.cat,
				name: data.name,
				value: data.value,
				icon: data.icon,
				// desc: data.desc,
			}
		});
		simulation.nodes(nodes).on('tick', ticked);

		svg.style('background-color', '#ffffff');
		// console.log(nodes);
		let node = svg.selectAll('.node')
			.data(nodes)
			.enter().append('g')
			.attr('class', 'node')
			.call(d3.drag()
				.on('start', (d) => {
					if (!d3.event.active) simulation.alphaTarget(0.2).restart();
					d.fx = d.x;
					d.fy = d.y;
				})
				.on('drag', (d) => {
					d.fx = d3.event.x;
					d.fy = d3.event.y;
				})
				.on('end', (d) => {
					if (!d3.event.active) simulation.alphaTarget(0);
					d.fx = null;
					d.fy = null;
				}));

		node.append('circle')
			.attr('id', d => d.id)
			.attr('r', 0)
			.style('fill', d => scaleColor(d.cat))
			.transition().duration(2000).ease(d3.easeElasticOut)
				.tween('circleIn', (d) => {
					let i = d3.interpolateNumber(0, d.radius);
					return (t) => {
						d.r = i(t);
						simulation.force('collide', forceCollide);
					}
				})

		node.append('clipPath')
			.attr('id', d => `clip-${d.id}`)
			.append('use')
			.attr('xlink:href', d => `#${d.id}`);


		// display image as circle icon
		node.filter(d => String(d.icon).includes('img/'))
			.append('image')
			.classed('node-icon', true)
			.attr('clip-path', d => `url(#clip-${d.id})`)
			.attr('xlink:href', d => d.icon)
			.attr('x', d => - d.radius * 0.7)
			.attr('y', d => - d.radius * 0.7)
			.attr('height', d => d.radius * 2 * 0.7)
			.attr('width', d => d.radius * 2 * 0.7)

		node.append('title')
			.text(d => (d.cat + '::' + d.name + '\n' + format(d.value)));

		let legendOrdinal = d3.legendColor()
			.scale(scaleColor)
			.shape('circle');

		let legend = svg.append('g')
			.classed('legend-color', true)
			.attr('text-anchor', 'start')
			.attr('transform','translate(20,30)')
			.style('font-size','12px')
			.call(legendOrdinal);


		let sizeScale
		if (filter=="rating" || filter=="both"){
			sizeScale = d3.scaleOrdinal()
  			.domain(['lower rating', 'higher rating'])
  			.range([5, 10] );

		}else{
			sizeScale = d3.scaleOrdinal()
  			.domain([''])
  			.range([0] );
		}	
		// let sizeScale = d3.scaleOrdinal()
  // 			.domain(['lower rating', 'higher rating'])
  // 			.range([5, 10] );

		let legendSize = d3.legendSize()
			.scale(sizeScale)
			.shape('circle')
			.shapePadding(10)
			.labelAlign('end');

		let legend2 = svg.append('g')
			.classed('legend-size', true)
			.attr('text-anchor', 'start')
			.attr('transform', 'translate(150, 25)')
			.style('font-size', '12px')
			.call(legendSize);


		// Form with filter options

		let form = svg.append('foreignObject')
			.attr('x', 10 * 0.5 * 0.8)
			.attr('y', 390 * 0.5 * 0.8)
            .attr("width", 120)
            .attr("height",200)	


		var div = form.append('xhtml:div')
                        .append('div')

        var field = div.append('fieldset');
        	
    	field.append('legend')
    		.html('Choose a filter');

		var opt1Div = field.append('div');

		opt1Div.append('input')
			.attr('type', 'checkbox')
			.attr('id', 'genre')
			.attr('value', 'genre');   

		opt1Div.append('label')
			.attr('for', 'genre')
			.html('Genre');  



		var opt2Div = field.append('div');

		opt2Div.append('input')
			.attr('type', 'checkbox')
			.attr('id', 'rating')
			.attr('value', 'rating');   

		opt2Div.append('label')
			.attr('for', 'rating')
			.html('Rating');  


		if (filter =='rating') {
			d3.select("#rating").attr('checked', true);
			console.log('check rating');
		}else if (filter =='genre') {
			d3.select("#genre").attr('checked', true);
			console.log('check genre');
		}else if (filter == 'both'){
			d3.select("#genre").attr('checked', true);
			d3.select("#rating").attr('checked', true);
			console.log('check both');
		}		

		d3.select("#rating").on("change",update);
		d3.select("#genre").on("change",update);

		function update(){
				console.log('checkbox check');
				if(d3.select("#genre").property("checked") && d3.select("#rating").property("checked")){
					drawGraph('both');
					console.log('both update');
				}else
					if(d3.select("#genre").property("checked")){
					drawGraph('genre');
					console.log('genre update');
				}else 
					if(d3.select("#rating").property("checked")){
					drawGraph('rating');
					console.log('rating update');
				}else{
					drawGraph('none');
					console.log('Nothing checked');
				} 		
			}

 

		// blur
		d3.select(document).on('click', () => {
			let target = d3.event.target;
			// check if click on document but not on the circle overlay
			if (!target.closest('#circle-overlay') && focusedNode) {
				focusedNode.fx = null;
				focusedNode.fy = null;
				simulation.alphaTarget(0.2).restart();
				d3.transition().duration(2000).ease(d3.easePolyOut)
					.tween('moveOut', function () {
						console.log('tweenMoveOut', focusedNode);
						let ir = d3.interpolateNumber(focusedNode.r, focusedNode.radius);
						return function (t) {
							focusedNode.r = ir(t);
							simulation.force('collide', forceCollide);
						};
					})
					.on('end', () => {
						focusedNode = null;
						simulation.alphaTarget(0);
					})
					.on('interrupt', () => {
						simulation.alphaTarget(0);
					});

				// hide all circle-overlay
				d3.selectAll('.circle-overlay').classed('hidden', true);
				d3.selectAll('.node-icon').classed('node-icon--faded', false);
			}
		});

		function ticked() {
			node
				.attr('transform', d => `translate(${d.x},${d.y})`)
				.select('circle')
					.attr('r', d => d.r);
		}

	};

	drawGraph('none');
