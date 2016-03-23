
var CommonFilter = function (field, value) {
  var common_json = {'common': {}}
  common_json['common'][field] = {'query': value}
  return common_json
}

var RangeFilter = function (field, value) {
  var filter_json = {'range': {}}
  filter_json['range'][field] = {}
  if (typeof value.min !== 'undefined')
    filter_json['range'][field]['gte'] = value.min
  if (typeof value.max !== 'undefined')
    filter_json['range'][field]['lte'] = value.max
  return filter_json
}

var TermFilter = function (field, value) {
  var term_json = {'term': {}}
  term_json['term'][field] = value
  return term_json
}

var TermsFilter = function (field, values) {
  var terms_json = {'terms': {}}
  terms_json['terms'][field] = values
  return terms_json
}

var NestedFilter = function (path, score_mode, queries) {
  var nested_filter_json = {
    nested: {
      path: path,
      query: {bool: {must: [queries]}}
    }
  }
  if (score_mode !== undefined)
    nested_filter_json['nested']['score_mode'] = score_mode

  return nested_filter_json
}
exports.CommonFilter = module.exports.CommonFilter = CommonFilter
exports.NestedFilter = module.exports.NestedFilter = NestedFilter
exports.RangeFilter = module.exports.RangeFilter = RangeFilter
exports.TermFilter = module.exports.TermFilter = TermFilter
exports.TermsFilter = module.exports.TermsFilter = TermsFilter
