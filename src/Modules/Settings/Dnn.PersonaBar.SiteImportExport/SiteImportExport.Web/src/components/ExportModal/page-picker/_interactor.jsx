import React, { Component } from "react";
import { PropTypes } from "prop-types";
import { PagePickerDesktop } from "./_new-page-picker";
import { PagePickerDataManager } from "./helpers";
import { IconSelector } from "./icons";
import { global } from "./_global";
const styles = global.styles;

const floatLeft = styles.float();
const merge = styles.merge;
const ppdm = new PagePickerDataManager();

const serializeQueryStringParameters = (obj) => {
  const s = [];
  for (let p in obj) {
    const data = encodeURIComponent(p) + "=" + encodeURIComponent(obj[p])
    obj.hasOwnProperty(p) ? s.push(data) : null
  }
  return s.join("&");
}

let childContexts = []
let root = {}
root.selected = true


export class PagePickerInteractor extends Component {

  constructor(props) {
    super();
    this.cached_ChildTabs;
    this.icon = IconSelector("arrow_bullet");
    this.PortalTabsParameters = props.PortalTabsParameters
    this.InitialTabsURL = "http://auto.engage458.com/API/PersonaBar/Tabs/GetPortalTabs?portalId=0&cultureCode=&isMultiLanguage=false&excludeAdminTabs=true&disabledNotSelectable=false&roles=&sortOrder=0";
    this.DescendantTabsURL = "http://auto.engage458.com/API/PersonaBar/Tabs/GetTabsDescendants?portalId=0&cultureCode=&isMultiLanguage=false&excludeAdminTabs=true&disabledNotSelectable=false&roles=&sortOrder=0";

    this.ExportModalOnSelect = props.OnSelect;
    this.serviceFramework = props.serviceFramework;
    this.moduleRoot = props.moduleRoot
    this.controller = props.controller

    this.copy = {}

  }

  componentWillMount() {
    this.setState({ tabs: [],  childrenSelected: true });
    this.init();
  }

  init() {
    this.serviceFramework.moduleRoot = this.moduleRoot
    this.serviceFramework.controller = this.controller

    const ExportInitialSelection = () => {
      const selection = this._generateSelectionObject(this.state.tabs);
      this.ExportModalOnSelect(selection);
    };

    const cache = (tabdata) => this.copy = JSON.parse(JSON.stringify(tabdata))
    const assign = (tabdata) => this.PortalTabs = tabdata

    const compose = (tabdata, ...fns) => fns.forEach( fn => fn(tabdata) )

    this._serviceFrameworkGetInitialTabs()
    .then( tabdata => compose(tabdata, cache, assign) )
    .then(() => this.setState({ tabs: this.PortalTabs}))
    .then(() => this.flatTabs = ppdm.flatten(this.PortalTabs))
    .then(() => this.setState({ tabs: this.PortalTabs, flatTabs: this.flatTabs }))
    .then(() => ExportInitialSelection())

  }

  // _requestInitialTabs = () => {
  //   const ExportInitialSelection = () => {
  //     const selection = this._generateSelectionObject(this.state.tabs);
  //     this.ExportModalOnSelect(selection);
  //   };
  //
  //   this._xhr(this.InitialTabsURL)
  //   .then(tabdata => this.PortalTabs = tabdata)
  //   .then(() => this.setState({ tabs: this.PortalTabs, selectAll: this.state.selectAll }))
  //   .then(() => this.flatTabs = ppdm.flatten(this.PortalTabs))
  //   .then(() => this.setState({ tabs: this.PortalTabs, flatTabs: this.flatTabs }))
  //   .then(() => ExportInitialSelection())
  //
  //   .catch(() => this.PortalTabs = this.tabs);
  // }

  _serviceFrameworkGetInitialTabs() {

    return new Promise((resolve, reject) => {
      const query = serializeQueryStringParameters(this.PortalTabsParameters)
      console.log(query)
      const params = `GetPortalTabs?${query}`
      this.serviceFramework.get(params, {}, (res)=>resolve(res.Results), (err)=>reject(res))
    })
  }

  _serviceFrameworkGetDescendants() {
  }

  _requestDescendantTabs = (ParentTabId) => {
    console.log("requeting descendantTabs");
    let descendantTabs = null;
    const inspect = (tabs) => console.log("inspecting :", tabs);
    const params = `&parentId=${ParentTabId}`;
    const mapToFlatTabs = (tabs) => tabs.map(tab => this.flatTabs[`${tab.TabId}-${tab.Name}`] = tab);
    const captureDecendants = (tabs) => descendantTabs = tabs.map(tab => {
      !Array.isArray(tab.ChildTabs) ? tab.ChildTabs = [] : null;
      return tab;
    });

    const input = (tabs) => compose(tabs, mapToFlatTabs, captureDecendants, copy);
    const compose = (tabs, ...fns) => fns.forEach(fn => fn(tabs));
    const appendDescendants = (parentTab) => descendantTabs.forEach((tab) => parseInt(tab.ParentTabId) === parseInt(parentTab.TabId) ? parentTab.ChildTabs.push(tab) : null);

    let copiedDescendants = {}
    const copy = (descendantTabs) => copiedDescendants = JSON.parse(JSON.stringify(descendantTabs))
    const appendCopies = (parentTab) => copiedDescendants.forEach((tab) => parseInt(tab.ParentTabId) === parseInt(parentTab.TabId) ? parentTab.ChildTabs.push(tab) : null);

    return this._xhr(this.DescendantTabsURL, params)
    .then(input)
    .then(() => this._traverseChildTabs(appendDescendants))
    .then(() => this._traverseCopyTabs(appendCopies))
    .then(() => this.setState({ tabs: this.state.tabs }));
  }

  _xhr(url, params = "") {
    return new Promise((resolve, reject) => {
      let xhttp = new XMLHttpRequest();
      xhttp.onload = () => {
        const response = JSON.parse(xhttp.responseText).Results;
        resolve(response);
      };
      xhttp.open("GET", url + params, true);
      xhttp.onerror = () => reject(xhttp);
      xhttp.send();
    });
  }

  _getRootTab(selection) {
    return Object.keys(selection)
    .map(key => selection[key])
    .filter(tab => tab.TabId === -1 && tab.ParentTabId === 0);
  }

  _generateSelectionObject(tab) {
    return {
      "TabId": tab.TabId,
      "ParentTabId": tab.ParentTabId,
      "CheckedState": tab.CheckedState,
      "Name": tab.Name
    };
  }


  _filterOutUnchecked(tabs) {
    return tabs.filter(tab => !!tab.CheckedState);
  }

  _filterChildrenOfAllSelected(tabs) {
    const ParentTabIds = tabs.filter(tab => tab.CheckedState === 2).map(tab => tab.TabId);
    return tabs.filter(tab => ParentTabIds.indexOf(tab.ParentTabId) === -1);
  }

  _traverseChildTabs(comparator) {
    let ChildTabs = this.state.tabs.ChildTabs;
    const cached_childtabs = [];
    cached_childtabs.push(ChildTabs);
    const condition = (cached_childtabs.length > 0);
    const loop = () => {
      const childtab = cached_childtabs.length ? cached_childtabs.shift() : null;
      const left = () => childtab.forEach(tab => {
        Array.isArray(tab.ChildTabs) ? comparator(tab) : null;
        Array.isArray(tab.ChildTabs) && tab.ChildTabs.length ? cached_childtabs.push(tab.ChildTabs) : null;
        condition ? loop() : exit();
      });
      const right = () => null;
      childtab ? left() : right();
    };

    const exit = () => null;
    loop();
    return;
  }

  _traverseCopyTabs(comparator) {
    let ChildTabs = this.copy.ChildTabs;
    const cached_childtabs = [];
    cached_childtabs.push(ChildTabs);
    const condition = (cached_childtabs.length > 0);
    const loop = () => {
      const childtab = cached_childtabs.length ? cached_childtabs.shift() : null;
      const left = () => childtab.forEach(tab => {
        Array.isArray(tab.ChildTabs) ? comparator(tab) : null;
        Array.isArray(tab.ChildTabs) && tab.ChildTabs.length ? cached_childtabs.push(tab.ChildTabs) : null;
        condition ? loop() : exit();
      });
      const right = () => null;
      childtab ? left() : right();
    };

    const exit = () => null;
    loop();
    return;
  }


  _isAnyAllSelected(tabs) {
    return tabs.filter(tab => tab.CheckedState === 2).length ? true : false;
  }

  _mapSelection(selection, fn) {
    const mapped = [];
    for (let tab in selection) {
      const obj = fn(selection[tab]);
      mapped.push(obj);
    }
    return mapped;
  }

  _cacheOriginalState() {

  }


  export = (selection) => {
    const RootTab = this._getRootTab(selection);
    const filterOutMasterRootTab = (tabs) => tabs.filter(tab => parseInt(tab.TabId) !== -1);
    const onlyChildrenOrNoParents = (tabs) => tabs.filter(tab => parseInt(tab.CheckedState) === 1);
    const onlyParents = (tabs) => tabs.filter( tab => tab.CheckedState === 2)

    let tabs = this._mapSelection(selection, this._generateSelectionObject);
    tabs = this._filterOutUnchecked(tabs);
    const rootTab = tabs.filter(tab => parseInt(tab.TabId) === -1 )
    let childrenTabs = onlyChildrenOrNoParents(tabs);
    let parentTabs = onlyParents(tabs)


    const Left = () => {

      childrenTabs = childrenTabs.filter( (tab, i, arr) => {
        const ParentTabId = tab.ParentTabId
        const parent = tabs.filter( t =>  parseInt(t.TabId) === parseInt(ParentTabId) )[0];
        const parentExists = !!parent;
        const ParentCheckedState = 0;

        const falsey = () => falsey;
        const isAllChildrenChecked = () => parent.CheckedState == 2 ? true : false;

        const bool  = parentExists ? isAllChildrenChecked() : falsey();
        return !bool
      })

      console.log('childtabs', childrenTabs);
      console.log('parenttabs', parentTabs);

      const tabsExport = parentTabs.concat(childrenTabs)
      this.ExportModalOnSelect(tabsExport);
    };

    const Right = () => {
      console.log(tabs)
      this.ExportModalOnSelect(tabs);
    };
    this._isAnyAllSelected(tabs) ? Left() : Right();
  }

  setMasterRootCheckedState = () => {
    let totalChildren = 0;
    let childrenSelected = 0;
    const setLength = (tab) => typeof tab === "object" ? totalChildren++ : null;
    const isAllSelected = (tab) => tab.CheckedState ? childrenSelected++ : null;

    this._traverseChildTabs(setLength);
    this._traverseChildTabs(isAllSelected);

    const left = () => this.setState({ childrenSelected: true });
    const right = () => this.setState({ childrenSelected: false });

    childrenSelected !== 0 ? left() : right();
  }

  getChildTabs = (ParentTabId) => {
    return this._requestDescendantTabs(ParentTabId);
  }

  showChildTabs = () => {
    const update = Object.assign({},this.state.tabs);
    update.IsOpen = !this.state.tabs.IsOpen;
    this.setState({ tabs: update });
  }

  selectAll = () => {
    const tabs = JSON.parse(JSON.stringify(this.copy))
    const flatTabs = ppdm.flatten(tabs)
    tabs.IsOpen = true
    this.setState({tabs:tabs, flatTabs:flatTabs})
  }


  setCheckedState = () => {
    const update = Object.assign({}, this.state);
    update.tabs.CheckedState = this.state.tabs.CheckedState ? 0 : 2;
    update.flatTabs[`${this.state.tabs.TabId}-${this.state.tabs.Name}`].CheckedState = this.state.tabs.CheckedState;
    update.tabs.CheckedState === 2 ? this.selectAll() : this.setState({ tabs: update.tabs, flatTabs: update.flatTabs});

  }

  render_icon = (direction) => {
    const width = styles.width(100);
    const margin = styles.margin({ top: -2 });
    const animate = direction === "90deg" ? true : false;
    const render = (
      <div style={merge(width, margin)}>
        <this.icon animate={true} reset={false} direction={direction} />
      </div>
    );
    return render;
  }

  render_Bullet = () => {
    const direction = this.state.tabs.IsOpen && this.state.tabs.ChildTabs.length ? "90deg" : "0deg";
    const render = this.render_icon(direction);
    return render;
  }

  render_ListBullet = (tab, fn) => {
    const bullet = (() => {
      const width = styles.width(20, "px");
      const height = styles.height(20, "px");

      return (
        <div
          onClick={() => fn()}
          style={merge(floatLeft, width, height)}>
          {this.render_Bullet(tab)}
        </div>);
      })();
      return bullet;
    }

    render_ListCheckbox = () => {
      const checkbox = (() => {
        const padding = styles.padding({ all: 0 });
        return (
          <div style={merge(floatLeft, padding)}>
            <input
              type="checkbox"
              onChange={() => this.setCheckedState(this.state.tabs)}
              checked={this.state.tabs.CheckedState}
              />
          </div>);
        })();
        return checkbox;
      }

      render_PagePicker = () => {
        const pagepicker = (() => {
          const condition = (this.state.tabs.IsOpen && this.state.tabs.ChildTabs.length);
          const picker = (
            <PagePickerDesktop
              icon_type="arrow_bullet"
              flatTabs={this.state.flatTabs}
              tabs={this.state.tabs.ChildTabs}
              export={this.export}
              selectAll={this.selectAll}
              getChildTabs={this.getChildTabs}
              setMasterRootCheckedState={this.setMasterRootCheckedState}
              PortalTabsParameters={this.PortalTabsParameters}
              rootContext={this}
              root={root}
              />);

              return (
                <div>
                  {condition ? picker : null}
                </div>
              );

            })();

            return pagepicker;
          }

          render() {
            const listStyle = styles.listStyle();
            const textLeft = styles.textAlign("left");
            const ULPadding = styles.padding({ all: 3 });
            const spanPadLeft = styles.padding({ left: 5 });

            const checkbox = this.render_ListCheckbox(this.state.tabs);
            const bullet = this.render_ListBullet(this.state.tabs, () => this.showChildTabs(this.state.tabs));
            const pagepicker = this.render_PagePicker();

            return (
              <ul style={merge(listStyle, ULPadding)}>
                <li style={merge(textLeft, ULPadding)}>
                  {bullet}
                  {checkbox}
                  <span style={merge(spanPadLeft)}> {this.state.tabs.Name} </span>
                  {this.state.childrenSelected ? <span>*</span> : <span></span>}
                  {pagepicker}
                </li>
              </ul>
            );

          }
        }

        PagePickerInteractor.propTypes = {
          OnSelect: PropTypes.func.isRequired,
          PortalTabParamters: PropTypes.object.isRequired
        };
