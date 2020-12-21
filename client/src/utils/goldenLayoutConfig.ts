export default {
	dimensions : {
		borderWidth : 3,
		minItemWidth : 285
	},
	settings : {
		showPopoutIcon : false,
		showMaximiseIcon : false,
		showCloseIcon : false
	},
	content : [
		{
			type : "column",
			content : [
				{
					type : "stack",
					content : [
						{
							title : "QUERY EXPLORER",
							isClosable : false,
							type : "react-component",
							component : "queryComponent",
							setting : {
								showCloseIcon : false
							}
						}
					],
					extensions : {
						height : 85
					}
				},
				{
					type : "row",
					height : 100,
					content : [
						{
							title : "MODEL VIEW",
							isClosable : false,
							width : 15,
							type : "react-component",
							component : "modelViewer",
							setting : {
								showCloseIcon : false
							}
						},
						{
							type : "stack",
							width : 65,
							content : [
								{
									title : "GRAPH VIEW",
									type : "react-component",
									isClosable : false,
									component : "graph",
									props : {
										className : "graph-component"
									},
									setting : {
										showCloseIcon : false
									}
								}
							]
						},
						{
							title : "PROPERTY EXPLORER",
							isClosable : false,
							id : "gl-property-inspector",
							width : 20,
							type : "react-component",
							component : "propInspector",
							setting : {
								showCloseIcon : false
							}
						}
					]
				}
			]
		}
	]
};
