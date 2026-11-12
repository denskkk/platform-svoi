import uk_common from '../../messages/uk/common.json'
import uk_layout from '../../messages/uk/layout.json'
import uk_meta from '../../messages/uk/meta.json'
import uk_home from '../../messages/uk/home.json'
import uk_about from '../../messages/uk/about.json'
import uk_support from '../../messages/uk/support.json'
import uk_legal from '../../messages/uk/legal.json'
import uk_auth from '../../messages/uk/auth.json'
import uk_registerBusiness from '../../messages/uk/registerBusiness.json'
import uk_registerIndividual from '../../messages/uk/registerIndividual.json'
import uk_registerViewer from '../../messages/uk/registerViewer.json'
import uk_questionnaire from '../../messages/uk/questionnaire.json'
import uk_profile from '../../messages/uk/profile.json'
import uk_profileEdit from '../../messages/uk/profileEdit.json'
import uk_services from '../../messages/uk/services.json'
import uk_serviceRequests from '../../messages/uk/serviceRequests.json'
import uk_reviews from '../../messages/uk/reviews.json'
import uk_catalog from '../../messages/uk/catalog.json'
import uk_chat from '../../messages/uk/chat.json'
import uk_favorites from '../../messages/uk/favorites.json'
import uk_feed from '../../messages/uk/feed.json'
import uk_projects from '../../messages/uk/projects.json'
import uk_listings from '../../messages/uk/listings.json'
import uk_business from '../../messages/uk/business.json'
import uk_search from '../../messages/uk/search.json'
import uk_contacts from '../../messages/uk/contacts.json'
import uk_admin from '../../messages/uk/admin.json'
import uk_api from '../../messages/uk/api.json'
import uk_enums from '../../messages/uk/enums.json'
import en_common from '../../messages/en/common.json'
import en_layout from '../../messages/en/layout.json'
import en_meta from '../../messages/en/meta.json'
import en_home from '../../messages/en/home.json'
import en_about from '../../messages/en/about.json'
import en_support from '../../messages/en/support.json'
import en_legal from '../../messages/en/legal.json'
import en_auth from '../../messages/en/auth.json'
import en_registerBusiness from '../../messages/en/registerBusiness.json'
import en_registerIndividual from '../../messages/en/registerIndividual.json'
import en_registerViewer from '../../messages/en/registerViewer.json'
import en_questionnaire from '../../messages/en/questionnaire.json'
import en_profile from '../../messages/en/profile.json'
import en_profileEdit from '../../messages/en/profileEdit.json'
import en_services from '../../messages/en/services.json'
import en_serviceRequests from '../../messages/en/serviceRequests.json'
import en_reviews from '../../messages/en/reviews.json'
import en_catalog from '../../messages/en/catalog.json'
import en_chat from '../../messages/en/chat.json'
import en_favorites from '../../messages/en/favorites.json'
import en_feed from '../../messages/en/feed.json'
import en_projects from '../../messages/en/projects.json'
import en_listings from '../../messages/en/listings.json'
import en_business from '../../messages/en/business.json'
import en_search from '../../messages/en/search.json'
import en_contacts from '../../messages/en/contacts.json'
import en_admin from '../../messages/en/admin.json'
import en_api from '../../messages/en/api.json'
import en_enums from '../../messages/en/enums.json'
import type { Locale } from './config'
import type { Messages } from './translate'

const uk = {
  common: uk_common,
  layout: uk_layout,
  meta: uk_meta,
  home: uk_home,
  about: uk_about,
  support: uk_support,
  legal: uk_legal,
  auth: uk_auth,
  registerBusiness: uk_registerBusiness,
  registerIndividual: uk_registerIndividual,
  registerViewer: uk_registerViewer,
  questionnaire: uk_questionnaire,
  profile: uk_profile,
  profileEdit: uk_profileEdit,
  services: uk_services,
  serviceRequests: uk_serviceRequests,
  reviews: uk_reviews,
  catalog: uk_catalog,
  chat: uk_chat,
  favorites: uk_favorites,
  feed: uk_feed,
  projects: uk_projects,
  listings: uk_listings,
  business: uk_business,
  search: uk_search,
  contacts: uk_contacts,
  admin: uk_admin,
  api: uk_api,
  enums: uk_enums,
} as unknown as Messages

const en = {
  common: en_common,
  layout: en_layout,
  meta: en_meta,
  home: en_home,
  about: en_about,
  support: en_support,
  legal: en_legal,
  auth: en_auth,
  registerBusiness: en_registerBusiness,
  registerIndividual: en_registerIndividual,
  registerViewer: en_registerViewer,
  questionnaire: en_questionnaire,
  profile: en_profile,
  profileEdit: en_profileEdit,
  services: en_services,
  serviceRequests: en_serviceRequests,
  reviews: en_reviews,
  catalog: en_catalog,
  chat: en_chat,
  favorites: en_favorites,
  feed: en_feed,
  projects: en_projects,
  listings: en_listings,
  business: en_business,
  search: en_search,
  contacts: en_contacts,
  admin: en_admin,
  api: en_api,
  enums: en_enums,
} as unknown as Messages

const dictionaries: Record<Locale, Messages> = { uk, en }

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale]
}
