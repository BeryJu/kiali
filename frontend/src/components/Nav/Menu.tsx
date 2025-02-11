import _ from 'lodash';
import * as React from 'react';
import { matchPath } from 'react-router';
import { Link } from 'react-router-dom';
import { Nav, NavList, NavItem } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { history } from '../../app/History';
import { navMenuItems } from '../../routes';
import { serverConfig } from '../../config';

const ExternalLink = ({ href, name }) => (
  <NavItem isActive={false} key={name} className={'external_link'}>
    <a className="pf-c-nav__link" href={href} target="_blank" rel="noopener noreferrer">
      {name} <ExternalLinkAltIcon style={{ margin: '-4px 0 0 5px' }} />
    </a>
  </NavItem>
);

type MenuProps = {
  isNavOpen: boolean;
  location: any;
  jaegerUrl?: string;
};

type MenuState = {
  activeItem: string;
};

export class Menu extends React.Component<MenuProps, MenuState> {
  static contextTypes = {
    router: () => null
  };

  constructor(props: MenuProps) {
    super(props);
    this.state = {
      activeItem: 'Overview'
    };
  }

  componentDidUpdate(prevProps: Readonly<MenuProps>) {
    if (prevProps.isNavOpen !== this.props.isNavOpen) {
      // Dispatch an extra "resize" event when side menu toggle to force that metrics charts resize
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 200);
    }
  }

  renderMenuItems = () => {
    const { location } = this.props;
    const allNavMenuItems = navMenuItems;
    const graphEnableCytoscape = serverConfig.kialiFeatureFlags.uiDefaults.graph.impl !== 'pf';
    const graphEnablePatternfly = serverConfig.kialiFeatureFlags.uiDefaults.graph.impl !== 'cy';
    const activeMenuItem = allNavMenuItems.find(item => {
      let isRoute = matchPath(location.pathname, { path: item.to, exact: true, strict: false }) ? true : false;
      if (!isRoute && item.pathsActive) {
        isRoute = _.filter(item.pathsActive, path => path.test(location.pathname)).length > 0;
      }
      return isRoute;
    });

    return allNavMenuItems
      .filter(item => {
        if (item.title === 'Mesh') {
          return serverConfig.clusterInfo?.name !== undefined;
        }
        if (item.title === 'Graph [Cy]') {
          return graphEnableCytoscape;
        }
        if (item.title === 'Graph [PF]') {
          return graphEnablePatternfly;
        }
        return true;
      })
      .map(item => {
        if (item.title === 'Distributed Tracing') {
          return (
            this.props.jaegerUrl && (
              <ExternalLink key={item.to} href={this.props.jaegerUrl} name="Distributed Tracing" />
            )
          );
        }

        let title = item.title;
        if (title === 'Graph [Cy]' && !graphEnablePatternfly) {
          title = 'Graph';
        }
        if (title === 'Graph [PF]' && !graphEnableCytoscape) {
          title = 'Graph';
        }

        return (
          <NavItem isActive={activeMenuItem === item} key={item.to}>
            <Link id={title} to={item.to} onClick={() => history.push(item.to)}>
              {title}
            </Link>
          </NavItem>
        );
      });
  };

  render() {
    return (
      <Nav aria-label="Nav" theme={'dark'}>
        <NavList>{this.renderMenuItems()}</NavList>
      </Nav>
    );
  }
}
