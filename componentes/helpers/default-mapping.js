/*

Data properites can be interpolatable strings or objects
  Interpolatable string: #{} @{}
  Objects: Have a [value] and a [type]

    Values: are interpolatable strings while
    Types: are strings withe the unit type. Plain text

#{reference} referes to an inline URI subject
@{value} placeholder for the value of the reference from in line context


*/


let mapping={
  "N353":{
    "Ensaio":{
      type:"class",
      name:"study",
      valueType:"named_node",
      "naming_scheme":'study_n@{value}',
      properties:{
        ObjectProperties:[
          {hasEnvironment:"#{environment_53055}"},
          {hasLocation:"#{forest_53055}"},
          {hasBiologicalMaterial:"#{Codigo}"},
          {partOf:"#{raiz_eucalyptus_pilot}"}
        ],
        DataProperties:[
          {hasObservationUnitDescription:{value:"Eucalyptus forests at Monte da Nave divided into three plots of areas 0.302ha, 0.129ha and 0.180ha, with trees organized into rows and columns.",type:"@en"}},    
          {hasInternalIdentifier:"@{value}"},
          {"hasStartDateTime":{value:"2011-11-18T00:00:00",type:"xsd:dateTime"}},   //Minimum of the dates? || Manually entry
        ]    
      }
    },
    "Data":{
      type:"dataProperty",
      name:"hasDateTime",
      valueType:"xsd:dateTime",
      "naming_scheme":'@{value}'
    },
    "Ordem":{
      type:"class",
      name:"observation_unit",
      valueType:"named_node",
      "naming_scheme":'position_@{value}_n@{Ensaio}',
      properties:{
        ObjectProperties:[
          {partOf:"#{Ensaio}"},
          {hasObservationLevel:"#{plant_level}"},
          {hasSpatialDistribution:"#{Rep}"},    
          {hasSpatialDistribution:"#{Poligono}"},
          {hasBiologicalMaterial:"#{Codigo}"},
          {hasSpatialDistribution:"#{Linha}"},    
          {hasSpatialDistribution:"#{Pos/linha}"},    
        ],
        DataProperties:[
          {hasInternalIdentifier:{value:"@{value}",type:"xsd:integer"}}    
        ]    
      }
    },
    "Rep":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"rep_@{value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"#{rep_level}"},
        ],
        DataProperties:[  
          {hasValue:{value:"@{value}",type:"xsd:integer"}}    
        ]
      }
    },
    "Bloco":{
      type:"NA",
      name:"spatial_distribution",
      valueType:"NA",
      "naming_scheme":"plot_@{value}",
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
        ]      
      }
    },
    "Poligono":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"plot_@{value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"#{plot_level}"},
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:integer"}}    
        ]      
      }
    },
    "Linha":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"row_@{value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"#{Linha}"},
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:integer"}}    
        ]      
      }
    },
    "Pos/linha":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"column_@{value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"#{Pos/linha}"},
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:integer"}}    
        ]      
      }      
    },
    "Codigo":{
      type:"class",
      name:"biological_material",
      valueType:"named_node",
      "naming_scheme":'pedigree_@{value}',
      properties:{
        ObjectProperties:[],
        DataProperties:[
          {hasSpecies:{value:"globulus", type:"xsd:string"}},
          {hasGenus:{value:"Eucalyptus",type:"xsd:string"}},
          {hasTaxonIdentifier:{value:"http://purl.bioontology.org/ontology/NCBITAXON/34317",type:"xsd:anyURI"}},  //incorrect
          {hasInternalIdentifier:{value:"@{value}",type:"xsd:integer"}},
          //{hasDescription:{value:"unknown parents#{mustbecodedsomehow}",type:"xsd:string"}} //
        ]
      }      
    },
    "t":{
      type:"class",
      name:"observation",
      valueType:"named_node",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{age}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:float"}},
          {hasDateTime:{value:"@{Data}",type:"xsd:dateTime"}}
        ]
      }
    },
    "Alt (m)":{
     type:"class",
     name:"observation",
     valueType:"named_node",
     "naming_scheme":'obs_@{auto_increment}',
     properties:{
       ObjectProperties:[
         {hasObservedSubject:"#{Ordem}"},
         {hasVariable:"#{height}"}
       ],
       DataProperties:[
         {hasValue:{value:"@{value}",type:"xsd:float"}},
         {hasDateTime:{value:"@{Data}",type:"xsd:dateTime"}}
       ]
     }
    },
    "Dap (cm)":{
      type:"class",
      name:"observation",
      valueType:"integer",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{diameter_at_breast_height}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:float"}},
          {hasDateTime:{value:"@{Data}",type:"xsd:dateTime"}}
        ]
      }
    },
    "Cod_Med":{
      type:"class",
      name:"observation",
      valueType:"integer",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{status_assessment}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:string"}}, ///Scale (convert)
          {hasDateTime:{value:"@{Data}",type:"xsd:dateTime"}}
        ]
      }
    }
  },
  "caracteriza-ensaios":{  //Change name once in major mapping
    "Cod_Mata":{
      type:"class",
      name:"named_location",
      valueType:"named_node",
      "naming_scheme":'forest_@{value}',
      properties:{
        ObjectProperties:[
          {hasCountry:"#{Portugal}"}
        ],
        DataProperties:[
          { hasAddress:{ value:"@{concelho},@{distrito}", type:"xsd:string" } },
          { hasName:{ value:"@{nome}", type:"xsd:string" } },
        ]
      },
    },
    "talhao":{
      type:"unsure", //TODO
    },
    "nome":{
      type:"dataProperty",
      name:"hasName",
      valueType:"xsd:string",
      "naming_scheme":'@{value}'
    },
    "cod_ensaio":{
      type:"unsure",  //TODO
    },
    "Data_instal":{
      type:"unsure",  //TODO
    }, 
    "concelho":{
      type:"dataProperty",
      name:"hasAddress",
      valueType:"xsd:string",
      "naming_scheme":'@{value}'
    },
    "distrito":{
      type:"dataProperty",
      name:"hasName",
      valueType:"xsd:string",
      "naming_scheme":'@{value}'
    },
    "poligono":{
      type:"dataProperty",
      name:"hasName",
      valueType:"xsd:string",
      "naming_scheme":'@{value}'
    },
    "environment":{
      type:"class",
      name:"environment",
      valueType:"xsd:string",
      "naming_scheme": "environment_@{value}",
      properties:{
        ObjectProperties:[],
        DataProperties:[
          { hasEnvironmentParameter: "#{solo_fao}"},  //Probably ObjectProperties
          { hasEnvironmentParameter: "#{PMA}"}, 
          { hasEnvironmentParameter: "#{P678}"},
          { hasEnvironmentParameter: "#{DPS1mm}"},
          { hasEnvironmentParameter: "#{TMED}"},
          { hasEnvironmentParameter: "#{TMAX}"},
          { hasEnvironmentParameter: "#{TMIN}"},
          { hasEnvironmentParameter: "#{TMAX_AGO}"},
          { hasEnvironmentParameter: "#{TMIN_JAN}"},
          { hasEnvironmentParameter: "#{DTS25}"},
          { hasEnvironmentParameter: "#{DTI0}"},
          { hasEnvironmentParameter: "#{tipo_verao}"},
          { hasEnvironmentParameter: "#{tipo_inver}"},
          { hasEnvironmentParameter: "#{pot_clim}"},
          { hasEnvironmentParameter: "#{pot_solo}"},
          { hasEnvironmentParameter: "#{reg_ec}"},
          { hasEnvironmentParameter: "#{RPS}"},
        ]      
      }      
    },
    "area_ha":{
      type:"dataProperty",
      name:"hasName",
      valueType:"xsd:string",
      "naming_scheme":'@{value}'
    },
    "litologia":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'lithology_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"litologia", type:"xsd:string" } },
        ]      
      }
    },
    "solo_fao":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'solo_fao_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"solo_fao", type:"xsd:string" } },
        ]      
      }
    },
    "PMA":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'PMA_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"PMA", type:"xsd:string" } },
        ]      
      }
    },
    "P678":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'P678_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"P678", type:"xsd:string" } },
        ]      
      }
    },    
    "DP78":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'DP78_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"DP78", type:"xsd:string" } },
        ]      
      }
    },  
    "DPS1mm":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'DPS1mm_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"DPS1mm", type:"xsd:string" } },
        ]      
      }
    },  
    "TMED":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'TMED_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"TMED", type:"xsd:string" } },
        ]      
      }
    },  
    "TMAX":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'TMAX_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"TMAX", type:"xsd:string" } },
        ]      
      }
    },  
    "TMIN":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'TMIN_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"TMIN", type:"xsd:string" } },
        ]      
      }
    },  
    "TMAX_AGO":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'TMAX_AGO_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"TMAX_AGO", type:"xsd:string" } },
        ]      
      }
    },
    "TMIN_JAN":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'TMIN_JAN_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"TMIN_JAN", type:"xsd:string" } },
        ]      
      }
    },
    "DTS25":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'DTS25_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"DTS25", type:"xsd:string" } },
        ]      
      }
    },    
    "DTI0":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'DTI0_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"DTI0", type:"xsd:string" } },
        ]      
      }
    },
    "tipo_verao":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'tipo_verao_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"tipo_verao", type:"xsd:string" } },
        ]      
      }
    },
    "tipo_inver":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'tipo_inver_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"tipo_inver", type:"xsd:string" } },
        ]      
      }
    },
    "pot_clim":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'pot_clim_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"pot_clim", type:"xsd:string" } },
        ]      
      }
    },
    "pot_solo":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'pot_solo_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"pot_solo", type:"xsd:string" } },
        ]      
      }
    },
    "reg_ec":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'reg_ec_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"reg_ec", type:"xsd:string" } },
        ]      
      }
    },      
    "RPS":{
      type:"class",
      name:"environment_parameter",
      valueType:"xsd:string",
      "naming_scheme":'RPS_@{Cod_Mata}',
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
          { hasValue:{ value:"@{value}", type:"xsd:string" } },
          { hasName:{ value:"RPS", type:"xsd:string" } },
        ]      
      }
    }
  }, 
  "Materiais-pedigree-representati":{  //Change name once in major mapping
    "Materiais":{
      type:"class",
      name:"biological_material",
      valueType:"named_node",
      "naming_scheme":'pedigree_@{value}',
      properties:{
        ObjectProperties:[],
        DataProperties:[
          {hasSpecies:{value:"@{speciesEpitet}", type:"xsd:string"}},   //HOW to get correct | Fix eccel
          {hasGenus:{value:"Eucalyptus",type:"xsd:string"}},    //HOW To get correct
          {hasDescription:{value:"@{Sp}", type:"xsd:string"}},
          {hasTaxonIdentifier:{value:"http://purl.bioontology.org/ontology/NCBITAXON/34317",type:"xsd:anyURI"}},  //TODO how to look up?
          {hasInternalIdentifier:"@{value}"},
          {hasDescription:{value:"mother:@{Mae};father:@{Pai}",type:"xsd:string"}} //TODO replace 0 with unknown
        ]
      }  
    },
    "Sp":{
      type:"unsure", //TODO
    },
    "speciesEpitet":{
      type:"unsure"
    },
    "Mae":{
      type:"unsure", //TODO
    },
    "Pai":{
      type:"unsure", //TODO
    },
    "N353":{
      type:"objectProperty",
      name:"hasName",
      valueType:"xsd:string",
      "naming_scheme":'study_n353',
      /*properties:{
        ObjectProperties:[
          {hasBiologicalMaterial:"#{Materiais}"},   //HOW to get correct
        ],
        DataProperties:[]
      } */     
    },
    "N356":{
      type:"objectProperty",
      name:"hasName",
      valueType:"xsd:string",
      "naming_scheme":'study_n356',
      /*properties:{
        ObjectProperties:[
          {hasBiologicalMaterial:"#{Materiais}"},   //HOW to get correct
        ],
        DataProperties:[]
      } */     
    },
    "N369":{
      type:"objectProperty",
      name:"hasName",
      valueType:"xsd:string",
      "naming_scheme":'study_n369',
      /*properties:{
        ObjectProperties:[
          {hasBiologicalMaterial:"#{Materiais}"},   //HOW to get correct
        ],
        DataProperties:[]
      } */     
    },
    "total":{
      type:"none",
      name:"hasName",
      valueType:"xsd:string",
      "naming_scheme":'',
      properties:{
        ObjectProperties:[],
        DataProperties:[]
      }      
    }              
  },
  "PIL":{
    "Ensaio":{
      type:"dependent",
      name:"reference",
      valueType:"named_node",
      "naming_scheme":'study_n@{value}'
    },
    "Ensaio2":{
      type:"unsued",
      name:"none",
      valueType:"none",
      "naming_scheme":'@{value}'
    },
    "Ordem":{
      type:"class",
      name:"observation_unit",
      valueType:"named_node",
      "naming_scheme":'position_@{value}_n@{Ensaio}',
      properties:{
        ObjectProperties:[
          {partOf:"#{Ensaio}"},
          {hasObservationLevel:"#{plant_level}"},
          {hasBiologicalMaterial:"#{Codigo}"},
        ],
        DataProperties:[
          {hasInternalIdentifier:{value:"@{value}",type:"xsd:integer"}}    
        ]    
      }
    },
    "Codigo":{
      type:"class",
      name:"biological_material",
      valueType:"named_node",
      "naming_scheme":'pedigree_@{value}',
      properties:{
        ObjectProperties:[],
        DataProperties:[
          {hasSpecies:{value:"globulus", type:"xsd:string"}},
          {hasGenus:{value:"Eucalyptus",type:"xsd:string"}},
          {hasTaxonIdentifier:{value:"http://purl.bioontology.org/ontology/NCBITAXON/34317",type:"xsd:anyURI"}},
          {hasInternalIdentifier:{value:"@{value}",type:"xsd:integer"}},
          //{hasDescription:{value:"unknown parents#{mustbecodedsomehow}",type:"string"}} // //Added from Materiais-pedigree
        ]
      }      
    },
    "id-Pil":{
      type:"class",
      name:"observation",
      valueType:"named_node",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{age}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:float"}},
          {hasDateTime:{value:"@{Data-rec}",type:"xsd:dateTime"}}  //TODO convert datatime
        ]
      }
    },
    "Pil":{
      type:"class",
      name:"observation",
      valueType:"named_node",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{Pilodyn}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:float"}},
          {hasDateTime:{value:"@{Data-rec}",type:"xsd:dateTime"}}
        ]
      }
    },
    "Campanha":{
      type:"class",
      name:"observation",
      valueType:"named_node",
      "naming_scheme":'obs_@{auto_increment}'
    },
    "Data-rec":{
      type:"dataProperty",
      name:"hasDateTime",
      valueType:"xsd:dateTime",
      "naming_scheme":'@{value}'
    }                
  },
  "NIR":{
    "Ensaio":{
      type:"dataProperty",
      name:"hasDateTime",
      valueType:"xsd:dateTime",
      "naming_scheme":'study_n@{value}'
    },
    "Ensaio2":{
      type:"dataProperty",
      name:"hasDateTime",
      valueType:"xsd:dateTime",
      "naming_scheme":'@{value}'
    },
    "Amostra":{
      type:"class",
      name:"sample",
      valueType:"named_node",
      "naming_scheme":'samp_@{value}',
      properties:{
        ObjectProperties:[
          {hasObservationLevel:"#{plant_level}"},
          {derivesFrom:"#{Codigo}"},
        ],
        DataProperties:[
          {hasInternalIdentifier:{value:"@{value}",type:"xsd:integer"}}    
        ]    
      }
    },
    "Ordem":{
      type:"class",
      name:"observation_unit",
      valueType:"named_node",
      "naming_scheme":'position_@{value}_n@{Ensaio}',
      properties:{
        ObjectProperties:[
          {partOf:"#{Ensaio}"},
          {hasObservationLevel:"#{plant_level}"},
          {hasBiologicalMaterial:"#{Codigo}"},
        ],
        DataProperties:[
          {hasInternalIdentifier:{value:"@{value}",type:"xsd:integer"}}    
        ]    
      }
    },
    "Codigo":{
      type:"class",
      name:"biological_material",
      valueType:"named_node",
      "naming_scheme":'pedigree_@{value}',
      properties:{
        ObjectProperties:[],
        DataProperties:[
          {hasSpecies:{value:"globulus", type:"xsd:string"}},
          {hasGenus:{value:"Eucalyptus",type:"xsd:string"}},
          {hasTaxonIdentifier:{value:"http://purl.bioontology.org/ontology/NCBITAXON/34317",type:"xsd:anyURI"}},
          {hasInternalIdentifier:{value:"@{value}",type:"xsd:integer"}},
          //{hasDescription:{value:"unknown parents#{mustbecodedsomehow}",type:"string"}} // //Added from Materiais-pedigree
        ]
      }      
    },
    "id-Nira":{
      type:"class",
      name:"observation",
      valueType:"named_node",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Amostra}"},
          {hasVariable:"#{age}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:float"}},
          {hasDateTime:{value:"@{Data-rec}",type:"xsd:dateTime"}}  //TODO convert datatime
        ]
      }
    },
    "Ren_nir":{
      type:"class",
      name:"observation",
      valueType:"named_node",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Amostra}"},
          {hasVariable:"#{NIR_pulp_yield}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"xsd:float"}},
          {hasDateTime:{value:"@{Data-rec}",type:"xsd:dateTime"}}
        ]
      }
    },
    "Campanha":{
      type:"class",
      name:"observation",
      valueType:"named_node",
      "naming_scheme":'obs_@{auto_increment}'
    },
    "Data-rec":{
      type:"dataProperty",
      name:"hasDateTime",
      valueType:"xsd:dateTime",
      "naming_scheme":'@{value}'
    }                
  }
}


mapping["N353-short"]=mapping["N353"]
mapping["N356"]=mapping["N353"]
mapping["N369"]=mapping["N353"]
mapping["PIL-short"]=mapping["PIL"]
mapping["NIR-short"]=mapping["NIR"]

mapping["N356"].Ensaio.properties.ObjectProperties[0].hasEnvironment="#{environment_70293}"
mapping["N356"].Ensaio.properties.DataProperties[0].hasObservationUnitDescription={value:"Eucalyptus forests at Fonte Nova Telha with 1 plots of area 0.572ha, with trees organized into rows and columns.",type:"@en"}    
mapping["N356"].Ensaio.properties.DataProperties[2]["hasStartDateTime"]={value:"2017-01-31T00:00:00",type:"xsd:dateTime"}
mapping["N369"].Ensaio.properties.ObjectProperties[0].hasEnvironment="#{environment_54044}"
mapping["N369"].Ensaio.properties.DataProperties[0].hasObservationUnitDescription={value:"Eucalyptus forests at Fontoura with 3 plots of area 0.174ha, 0.305ha and 0.437ha, with trees organized into rows and columns.",type:"@en"}    
mapping["N369"].Ensaio.properties.DataProperties[2]["hasStartDateTime"]={value:"2015-01-10T00:00:00",type:"xsd:dateTime"}

mapping["N356-short"]=mapping["N356"]
mapping["N369-short"]=mapping["N353"]
                                           
module.exports=mapping