import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { ForumPageShell } from "@/components/forum/forum-page-shell"
import { HomeSidebarPanels } from "@/components/home/home-sidebar-panels"
import { LevelIcon } from "@/components/level-icon"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/rbutton"
import { getHomeAnnouncements } from "@/lib/announcements"
import { getCurrentUser } from "@/lib/auth"
import { buildLoginHrefWithRedirect } from "@/lib/auth-redirect"
import { getBoards } from "@/lib/boards"
import { formatNumber } from "@/lib/formatters"
import { getHomeSidebarHotTopics, resolveSidebarUser } from "@/lib/home-sidebar"
import { getSiteSettings } from "@/lib/site-settings"
import { getVerificationTypeDetailBySlug } from "@/lib/verifications"
import { getZones } from "@/lib/zones"

export const dynamic = "force-dynamic"

type VerificationDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata(props: VerificationDetailPageProps): Promise<Metadata> {
  const { slug } = await props.params
  const [settings, verification] = await Promise.all([
    getSiteSettings(),
    getVerificationTypeDetailBySlug(slug),
  ])

  if (!verification) {
    return {
      title: `认证不存在 - ${settings.siteName}`,
    }
  }

  return {
    title: `${verification.name} - ${settings.siteName}`,
    description: verification.description?.trim() || `查看 ${verification.name} 的认证说明、申请要求与当前已认证人数。`,
    alternates: {
      canonical: `/verifications/${verification.slug}`,
    },
  }
}

export default async function VerificationDetailPage(props: VerificationDetailPageProps) {
  const { slug } = await props.params
  const settingsPromise = getSiteSettings()
  const currentUserPromise = getCurrentUser()
  const verificationPromise = getVerificationTypeDetailBySlug(slug)
  const [settings, boards, zones, currentUser, announcements, verification] = await Promise.all([
    settingsPromise,
    getBoards(),
    getZones(),
    currentUserPromise,
    getHomeAnnouncements(3),
    verificationPromise,
  ])

  if (!verification) {
    notFound()
  }

  const [sidebarUser, hotTopics] = await Promise.all([
    resolveSidebarUser(currentUser, settings),
    getHomeSidebarHotTopics(settings.homeSidebarHotTopicsCount),
  ])
  const settingsHref = "/settings?tab=verifications"
  const applyHref = currentUser
    ? settingsHref
    : buildLoginHrefWithRedirect(settingsHref)
  const applicationCost = verification.pointsCost > 0
    ? `${formatNumber(verification.pointsCost)} ${settings.pointName}`
    : "免费申请"
  const fieldSummary = verification.formFields.length > 0
    ? `${verification.formFields.length} 个字段`
    : verification.needRemark
      ? "申请说明"
      : "基础说明"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[1200px] px-1">
        <ForumPageShell
          zones={zones}
          boards={boards}
          main={(
            <main className="mt-6 pb-12">
              <div className="flex flex-col gap-6">
                <section className="rounded-xl border border-border bg-card px-5 py-6 shadow-xs sm:px-7 sm:py-8">
                  <div className="mx-auto max-w-3xl text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Verification Detail
                    </p>
                    <div
                      className="mx-auto mt-5 flex h-28 w-fit min-w-28 max-w-full items-center justify-center rounded-[32px] px-5 text-6xl sm:h-32 sm:min-w-32 sm:px-6"
                      style={{
                        color: verification.color,
                        background: `linear-gradient(180deg, ${verification.color}20, ${verification.color}10)`,
                      }}
                    >
                      <LevelIcon
                        icon={verification.iconText}
                        color={verification.color}
                        className="h-14 min-w-14 max-w-full text-[56px] sm:h-16 sm:min-w-16 sm:text-[64px]"
                        emojiClassName="text-inherit"
                        svgClassName="[&>svg]:block"
                      />
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                        认证标识 {verification.slug}
                      </span>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                        {verification.status ? "开放申请" : "已停用"}
                      </span>
                    </div>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                      {verification.name}
                    </h1>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                      {verification.description?.trim() || "该认证用于展示用户在社区内的身份、资质或业务属性。"}
                    </p>
                    <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                      <VerificationStatCard label="已认证人数" value={`${formatNumber(verification.approvedUserCount)} 人`} />
                      <VerificationStatCard label="申请成本" value={applicationCost} />
                      <VerificationStatCard label="审核材料" value={fieldSummary} />
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <Link href={applyHref}>
                        <Button className="rounded-full px-5">
                          {currentUser ? "前往认证中心" : "登录后申请"}
                        </Button>
                      </Link>
                      <Link href="/faq/verification-system">
                        <Button variant="outline" className="rounded-full px-5">
                          查看认证规则
                        </Button>
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </main>
          )}
          rightSidebar={(
            <aside className="mt-6 hidden pb-12 lg:block">
              <HomeSidebarPanels
                user={sidebarUser}
                hotTopics={hotTopics}
                announcements={announcements}
                showAnnouncements={settings.homeSidebarAnnouncementsEnabled}
                siteName={settings.siteName}
                siteDescription={settings.siteDescription}
                siteLogoPath={settings.siteLogoPath}
                siteIconPath={settings.siteIconPath}
              />
            </aside>
          )}
        />
      </div>
    </div>
  )
}

function VerificationStatCard({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 text-base font-semibold text-foreground">
        {value}
      </div>
    </div>
  )
}
