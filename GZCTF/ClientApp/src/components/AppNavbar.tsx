import React, { FC, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  Stack,
  Center,
  Navbar,
  Avatar,
  Tooltip,
  createStyles,
  useMantineColorScheme,
  ActionIcon,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import {
  mdiAccountCircleOutline,
  mdiAccountGroupOutline,
  mdiFlagOutline,
  mdiHomeVariantOutline,
  mdiInformationOutline,
  mdiWeatherSunny,
  mdiWeatherNight,
  mdiLogout,
  mdiCheck,
  mdiWrenchOutline,
} from '@mdi/js'
import { Icon } from '@mdi/react'
import api, { Role } from '@Api'
import MainIcon from './icon/MainIcon'

const useStyles = createStyles((theme, _param, getRef) => {
  const active = { ref: getRef('activeItem') } as const

  return {
    active,
    link: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.colors.gray[1],
      cursor: 'pointer',

      '&:hover': {
        backgroundColor: theme.colors.gray[6] + '80',
      },

      [`&.${active.ref}, &.${active.ref}:hover`]: {
        backgroundColor: theme.fn.rgba(theme.colors[theme.primaryColor][7], 0.25),
        color: theme.colors[theme.primaryColor][4],
      },
    },

    navbar: {
      backgroundColor: theme.colors.gray[8],

      [theme.fn.smallerThan('xs')]: {
        display: 'none',
      },
    },

    tooltipBody: {
      marginLeft: 20,
      backgroundColor:
        theme.colorScheme === 'dark'
          ? theme.fn.darken(theme.colors[theme.primaryColor][8], 0.45)
          : theme.colors[theme.primaryColor][6],
      color:
        theme.colorScheme === 'dark' ? theme.colors[theme.primaryColor][4] : theme.colors.white[0],
    },

    menuBody: {
      left: 100,
    },
  }
})

interface NavbarItem {
  icon: string
  label: string
  link: string
  admin?: boolean
}

const items: NavbarItem[] = [
  { icon: mdiHomeVariantOutline, label: '主页', link: '/' },
  { icon: mdiFlagOutline, label: '赛事', link: '/games' },
  { icon: mdiAccountGroupOutline, label: '队伍', link: '/teams' },
  { icon: mdiInformationOutline, label: '关于', link: '/about' },
  { icon: mdiWrenchOutline, label: '管理', link: '/admin/notices', admin: true },
]

export interface NavbarLinkProps {
  icon: string
  label?: string
  link?: string
  onClick?: () => void
  isActive?: boolean
}

const NavbarLink: FC<NavbarLinkProps> = (props: NavbarLinkProps) => {
  const { classes, cx } = useStyles()

  return (
    <Tooltip label={props.label} classNames={{ tooltip: classes.tooltipBody }} position="right">
      <ActionIcon
        onClick={props.onClick}
        component={Link}
        to={props.link ?? '#'}
        className={cx(classes.link, { [classes.active]: props.isActive })}
      >
        <Icon path={props.icon} size={1} />
      </ActionIcon>
    </Tooltip>
  )
}

const getLabel = (path: string) =>
  items.find((item) =>
    item.link === '/'
      ? path === '/'
      : item.link.startsWith('/admin')
      ? path.startsWith('/admin')
      : path.startsWith(item.link)
  )?.label

const AppNavbar: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { classes } = useStyles()

  const [active, setActive] = useState(getLabel(location.pathname) ?? '')
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  const logout = () => {
    api.account.accountLogOut().then(() => {
      navigate('/')
      api.account.mutateAccountProfile()
      showNotification({
        color: 'teal',
        title: '登出成功',
        message: '',
        icon: <Icon path={mdiCheck} size={1} />,
        disallowClose: true,
      })
    })
  }

  const { data: user, error } = api.account.useAccountProfile({
    refreshInterval: 0,
    revalidateIfStale: false,
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err?.status === 403) {
        api.account.accountLogOut().then(() => {
          navigate('/')
          showNotification({
            color: 'teal',
            title: '账户已被禁用',
            message: '',
            icon: <Icon path={mdiCheck} size={1} />,
            disallowClose: true,
          })
        })
        return
      }

      if (err?.status === 401) return

      if (retryCount >= 10) return

      setTimeout(() => revalidate({ retryCount: retryCount }), 5000)
    },
  })

  useEffect(() => {
    if (location.pathname == '/') {
      setActive(items[0].label)
    }
    setActive(getLabel(location.pathname) ?? '')
  }, [location.pathname])

  const links = items
    .filter((m) => !m.admin || user?.role === Role.Admin)
    .map((link) => <NavbarLink {...link} key={link.label} isActive={link.label === active} />)

  return (
    <Navbar fixed width={{ xs: 70, base: 0 }} p="md" className={classes.navbar}>
      {/* Logo */}
      <Navbar.Section grow>
        <Center>
          <MainIcon
            style={{ width: '100%', height: 'auto', position: 'relative', left: 2 }}
            ignoreTheme
            onClick={() => navigate('/')}
          />
        </Center>
      </Navbar.Section>

      {/* Common Nav */}
      <Navbar.Section grow mb={20} mt={20} style={{ display: 'flex', alignItems: 'center' }}>
        <Stack align="center" spacing={5}>
          {links}
        </Stack>
      </Navbar.Section>

      <Navbar.Section
        grow
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'end' }}
      >
        <Stack align="center" spacing={5}>
          {/* Color Mode */}
          <Tooltip
            label={'切换至' + (colorScheme === 'dark' ? '浅色' : '深色') + '主题'}
            classNames={{ tooltip: classes.tooltipBody }}
            position="right"
          >
            <ActionIcon onClick={() => toggleColorScheme()} className={classes.link}>
              {colorScheme === 'dark' ? (
                <Icon path={mdiWeatherSunny} size={1} />
              ) : (
                <Icon path={mdiWeatherNight} size={1} />
              )}
            </ActionIcon>
          </Tooltip>

          {/* User Info */}
          {user && !error ? (
            <Menu position="right-end" offset={24} width={160}>
              <Menu.Target>
                <ActionIcon className={classes.link}>
                  {user?.avatar ? (
                    <Avatar src={user?.avatar} radius="md" size="md" />
                  ) : (
                    <Icon path={mdiAccountCircleOutline} size={1} />
                  )}
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>{user.userName}</Menu.Label>
                <Menu.Item
                  component={Link}
                  to="/account/profile"
                  icon={<Icon path={mdiAccountCircleOutline} size={1} />}
                >
                  用户信息
                </Menu.Item>
                <Menu.Item color="red" onClick={logout} icon={<Icon path={mdiLogout} size={1} />}>
                  登出
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Tooltip label="登录" classNames={{ tooltip: classes.tooltipBody }} position="right">
              <ActionIcon
                component={Link}
                to={`/account/login?from=${location.pathname}`}
                className={classes.link}
              >
                <Icon path={mdiAccountCircleOutline} size={1} />
              </ActionIcon>
            </Tooltip>
          )}
        </Stack>
      </Navbar.Section>
    </Navbar>
  )
}

export default AppNavbar
