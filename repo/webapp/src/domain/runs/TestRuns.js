import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from "react-router"
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    PageSection,
    Toolbar,
    ToolbarGroup,
    ToolbarItem,
    ToolbarSection

} from '@patternfly/react-core';
import {
    EditIcon,
    OutlinedSaveIcon,
    OutlinedTimesCircleIcon
} from '@patternfly/react-icons';
import { DateTime } from 'luxon';
import { NavLink } from 'react-router-dom';

import { byTest } from './actions';
import * as selectors from './selectors';

import { fetchTest } from '../tests/actions';
import { get } from '../tests/selectors';

import Table from '../../components/Table';
import Editor, { fromEditor } from '../../components/Editor';

//TODO how to prevent rendering before the data is loaded? (we just have start,stop,id)
const renderCell = (render) => (arg) => {
    const { cell: { value, row: { index } }, data, column } = arg;
    try {
        const useValue = (value === null || value === undefined) ? data[index][column.id.toLowerCase()] : value;
        const rendered = render(useValue, data[index])
        if (typeof rendered === "undefined" || rendered === null) {
            return "-"
        } else if (typeof rendered === "string") {
            //this is a hacky way to see if it looks like html :)
            if (rendered.trim().startsWith("<") && rendered.trim().endsWith(">")) {
                //render it as html
                return (<div dangerouslySetInnerHTML={{ __html: rendered }} />)
            } else {
                return rendered;
            }
        } else {
            return rendered;
        }
    } catch (e) {
        return "--"
    }
}
const idColumn = {
    Header: "Id", accessor: "id",
    Cell: (arg) => {
        const { cell: { value } } = arg;
        return (<NavLink to={`/run/${value}`}>{value}</NavLink>)
    }
};
const definedColumns = [
    { Header: "Start", accessor: v => window.DateTime.fromMillis(v.start).toFormat("yyyy-LL-dd HH:mm:ss ZZZ") },
    { Header: "Stop", accessor: v => window.DateTime.fromMillis(v.stop).toFormat("yyyy-LL-dd HH:mm:ss ZZZ") },
    //    These are removed because they assume the runs are specjEnterprise2010
    //    {
    //        "Header": "GC Overhead", "accessor": "gc", "jsonpath": "jsonb_path_query_array(data,'$.benchserver4.gclog[*] ? ( exists(@.capacity) )')",
    //        "render": (v)=>{
    //            const totalSeconds = v.reduce((total,entry)=>total+entry.seconds,0.0);
    //            const lastTimestamp = v[v.length-1].timestamp;
    //            return Number.parseFloat(100*totalSeconds/lastTimestamp).toFixed(3)+" %";
    //        }
    //    },
    //    { Header: "Scale", accessor: "scale", jsonpath: '$.faban.run.SPECjEnterprise."fa:runConfig"."fa:scale"."text()"' },
    //    { Header: "Ramp Up", accessor: "rampup", jsonpath: '$.faban.run.SPECjEnterprise."fa:runConfig"."fa:runControl"."fa:rampUp"."text()"' },
    //    { Header: "Faban ID", accessor: "fabanid", jsonpath: '$.faban.xml.benchResults.benchSummary.runId."text()"' },
]

export default () => {
    const { testId } = useParams();
    const test = useSelector(get(testId))
    const [edit, setEdit] = useState(false);
    const [columns, setColumns] = useState((test && test.view) ? test.view : definedColumns)
    const [data, setData] = useState(columns)
    const payload = useMemo(() => {
        const filtered = columns.filter(v => v.Header.toLowerCase() !== "id")
        filtered.sort((a,b)=>(typeof a.jsonpath !== "undefined") ? -1 : 0)
        const reduced = filtered
            .reduce((rtrn, entry) => {
                if (!entry.composite) {
                    if (typeof entry.jsonpath !== "undefined") {
                        if (typeof entry.accessor === "string") {
                            rtrn[entry.accessor] = entry.jsonpath
                        } else {
                            rtrn[entry.Header.replace(/\s/g, '_')] = entry.jsonpath
                        }
                    } else {
                        if (typeof rtrn[entry.accessor] === "undefined"){
                            if (typeof entry.accessor === "string") {
                                rtrn[entry.accessor] = entry.accessor
                            } else {
                                rtrn[entry.Header.replace(/\s/g, '_')] = entry.Header.replace(/\s/g, '_');
                            }    
                        }
                    }
                }
                return rtrn;
            }, {})
        return reduced;
    }, [columns]);
    const tableColumns = useMemo(() => {
        const rtrn = [idColumn]
        columns.forEach(col => {
            if (typeof col.render !== "undefined") {
                rtrn.push({
                    ...col,
                    Cell: renderCell(col.render)
                })
            } else {
                rtrn.push(col)
            }
        })
        return rtrn;
    }, [columns]);

    const dispatch = useDispatch();
    const runs = useSelector(selectors.testRuns(testId));
    useEffect(() => {
        dispatch(fetchTest(testId));
    }, [dispatch, testId])
    useEffect(() => {
        dispatch(byTest(testId, { map: payload }))

    }, [dispatch, payload])
    useEffect(() => {
        if (test && test.view) {
            setColumns(test.view)
        }
    }, [test])
    useEffect(() => {
        setData(columns)
    }, [columns])
    return (
        <PageSection>
            <Card style={{ [edit ? "height" : null]: '100%' }}>
                <CardHeader>
                    <Toolbar className="pf-l-toolbar pf-u-justify-content-space-between pf-u-mx-xl pf-u-my-md" style={{ justifyContent: "space-between" }}>
                        <ToolbarGroup>
                            <ToolbarItem className="pf-u-mr-xl">{`Test: ${test.name || testId}`}</ToolbarItem>
                        </ToolbarGroup>
                        <ToolbarGroup>
                            {edit ? (
                                <React.Fragment>
                                    <ToolbarItem><Button variant="plain" onClick={e => {
                                        setEdit(false);
                                        const fromE = fromEditor(data);
                                        setColumns(fromE);
                                    }
                                    }><OutlinedSaveIcon /></Button></ToolbarItem>
                                    <ToolbarItem><Button variant="plain" onClick={e => { setEdit(false) }}><OutlinedTimesCircleIcon /></Button></ToolbarItem>
                                </React.Fragment>
                            ) : (<Button variant="plain" onClick={e => setEdit(true)}><EditIcon /></Button>)}

                        </ToolbarGroup>
                    </Toolbar>
                </CardHeader>
                <CardBody>{
                    edit ? (<Editor value={data} onChange={e => { setData(e) }} />) : (<Table columns={tableColumns} data={runs} />)
                }</CardBody>
            </Card>
        </PageSection>
    )
}
