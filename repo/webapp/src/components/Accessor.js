import React, { useState, useEffect } from 'react'

import { useDispatch } from 'react-redux'

import { addExtractor, listExtractors } from '../domain/schemas/api.js'
import SchemaSelect from './SchemaSelect'

import {
   ActionGroup,
   Alert,
   Button,
   Form,
   FormGroup,
   Select,
   SelectOption,
   TextInput,
   Modal,
} from '@patternfly/react-core';

/* This is going to be a complex component with modal for Extractor definition */
export default ({ value = "", onChange = newValue => {}}) => {
   const onCreate = newValue => {
      setSelected({ accessor: newValue })
      setModalOpen(true)
   }
   const [isExpanded, setExpanded] = useState(false)
   const [selected, setSelected] = useState({ accessor: value, toString: () => value })
   const [options, setOptions] = useState([])
   const dispatch = useDispatch()
   useEffect(() => {
      listExtractors().then(response => setOptions(response))
   }, [])
   const [modalOpen, setModalOpen] = useState(false)
   const [addFailed, setAddFailed] = useState(false)
   return (<>
      <Select variant="typeahead"
              aria-label="Select accessor"
              isCreatable={true}
              onCreateOption={onCreate}
              isExpanded={isExpanded}
              onToggle={setExpanded}
              selections={selected}
              onClear={ () => {
                 setSelected(null)
                 setExpanded(false)
                 onChange(null)
              }}
              onSelect={ (e, newValue) => {
                 if (typeof(newValue) === "string") {
                    const name = newValue
                    newValue = { accessor: name, toString: () => name }
                 }
                 setSelected(newValue)
                 setExpanded(false)
                 onChange(newValue)
              }}
      >
      {options.map((option, index) => (
         <SelectOption key={index} value={{ ...option, toString: () => option.accessor }} />
      ))}
      </Select>
      { selected != null && selected.schema &&
         <span>Valid for schemas: { options.filter(e => e.accessor == selected.accessor).map(e => e.schema).join(", ") }</span>
      }
      { selected != null && selected.accessor && selected.accessor !== "" &&
         <Button variant="link" onClick={() => setModalOpen(true)}>Add extractor for a different schema...</Button>
      }
      <Modal title="Create extractor"
             isOpen={modalOpen}
             onClose={() => setModalOpen(false) }>
         <Form isHorizontal={true}>
            <FormGroup label="Accessor" isRequired={true}>
               <TextInput value={ selected.accessor }
                          isRequired
                          id="extractor-accessor"
                          name="extractor-accessor"
                          isValid={ selected.accessor && selected.accessor != "" }
                          onChange={ value => setSelected({ ...selected, accessor: value})}
                />
            </FormGroup>
            <FormGroup label="Schema" isRequired={true}>
               <SchemaSelect value={ selected.schema }
                             onChange={ value => { setSelected({ ...selected, schema: value, toString: () => selected.accessor })}} />
            </FormGroup>
            <FormGroup label="JSON path" isRequired={true}>
               <TextInput value={ selected.jsonpath }
                          isRequired
                          id="extractor-jsonpath"
                          name="extractor-jsonpath"
                          isValid={ selected.jsonpath && selected.jsonpath != "" }
                          onChange={ value => setSelected({ ...selected, jsonpath: value})}
              />
            </FormGroup>
            <ActionGroup>
               <Button variant="primary"
                       onClick={e => {
                          addExtractor(selected).then(response => {
                             setOptions([ ...options, selected ].sort())
                             setModalOpen(false)
                          }, e => {
                             setAddFailed(true)
                             setInterval(() => setAddFailed(false), 5000)
                          })
                       }}>Save</Button>
               <Button variant="secondary"
                       onClick={ () => {
                          setModalOpen(false)
                       }}>Cancel</Button>
         </ActionGroup>
         </Form>
         { addFailed &&
            <Alert variant="warning" title="Failed to add extractor" />
         }
       </Modal>
   </>)
}